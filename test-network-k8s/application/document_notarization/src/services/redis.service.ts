/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This sample uses BullMQ jobs to process submit transactions, which includes
 * retry support for failing jobs
 */

import { ConnectionOptions, Job, Queue, QueueScheduler, Worker } from 'bullmq';
import { Contract, Transaction } from 'fabric-network';
import * as config from '../config/config';
import { getRetryAction, JobNotFoundError, RetryAction } from '../utilities/errors';
import Fabric from './fabric.service';
import { logger } from '../utilities/logger';

export type JobData = {
  mspid: string;
  transactionName: string;
  transactionArgs: string[];
  transactionState?: Buffer;
  transactionIds: string[];
};

export type JobResult = {
  transactionPayload?: Buffer;
  transactionError?: string;
};

export type JobSummary = {
  jobId: string;
  transactionIds: string[];
  transactionPayload?: string;
  transactionError?: string;
};

class Redis {
  private static _instance: Redis;
  public jobQueue: Queue | undefined;
  private jobQueueWorkers: Array<Worker> | undefined;
  private readonly jobQueueScheduler: QueueScheduler | undefined;
  private connectionOptions = {
    port: config.redisPort,
    host: config.redisHost,
    username: config.redisUsername,
    password: config.redisPassword,
  };

  constructor() {
    if (config.submitJobQueueScheduler) {
      this.jobQueueScheduler = this.initJobQueueScheduler();
    }
    this.jobQueue = this.initJobQueue();
  }

  static getInstance() {
    if (this._instance) {
      return this._instance;
    }

    this._instance = new Redis();
    return this._instance;
  }

  private initJobQueue = (): Queue => {
    const connection = this.connectionOptions as ConnectionOptions;
    return new Queue(config.job_queue_name, {
      connection,
      defaultJobOptions: {
        attempts: config.submitJobAttempts,
        backoff: {
          type: config.submitJobBackoffType,
          delay: config.submitJobBackoffDelay,
        },
        removeOnComplete: config.maxCompletedSubmitJobs,
        removeOnFail: config.maxFailedSubmitJobs,
      },
    });
  };

  private initJobQueueScheduler = (): QueueScheduler => {
    const connection = this.connectionOptions as ConnectionOptions;
    const queueScheduler = new QueueScheduler(config.job_queue_name, {
      connection,
    });

    queueScheduler.on('failed', (jobId, failedReason) => {
      // TODO when does this happen, and how should it be handled?
      logger.error({ jobId, failedReason }, 'Queue sceduler failure');
    });

    return queueScheduler;
  };

  public initJobQueueWorker = async (fabricSvc: Fabric): Promise<void> => {
    const connection = this.connectionOptions as ConnectionOptions;
    const worker = new Worker<JobData, JobResult>(
      config.job_queue_name,
      async (job): Promise<JobResult> => {
        return await this.processSubmitTransactionJob(fabricSvc, job);
      },
      { connection, concurrency: config.submitJobConcurrency }
    );

    worker.on('failed', (job) => {
      logger.error({ job }, 'Job failed'); // WHY?!
    });

    // Important: need to handle this error otherwise worker may stop
    // processing jobs
    worker.on('error', (err) => {
      logger.error({ err }, 'Worker error');
    });

    if (logger.isLevelEnabled('debug')) {
      worker.on('completed', (job) => {
        logger.debug({ job }, 'Job completed');
      });
    }

    this.jobQueueWorkers?.push(worker);
  };

  public cleanUp = async (): Promise<void> => {
    if (Redis._instance) {
      Redis._instance = {} as Redis;
    }

    if (this.jobQueueScheduler != undefined) {
      logger.debug('Closing job queue scheduler');
      await this.jobQueueScheduler.close();
    }

    if (this.jobQueueWorkers != undefined) {
      logger.debug('Closing job queue worker');
      for (const worker of this.jobQueueWorkers) {
        await worker.close();
      }
    }

    if (this.jobQueue != undefined) {
      logger.debug('Closing job queue');
      await this.jobQueue.close();
    }
  };

  public addSubmitTransactionJob = async (
    submitQueue: Queue<JobData, JobResult>,
    mspid: string,
    transactionName: string,
    ...transactionArgs: string[]
  ): Promise<string> => {
    const jobName = `submit ${transactionName} transaction`;
    const job = await submitQueue.add(jobName, {
      mspid,
      transactionName,
      transactionArgs: transactionArgs,
      transactionIds: [],
    });

    if (job?.id === undefined) {
      throw new Error('Submit transaction job ID not available');
    }

    return job.id;
  };

  public getJobSummary = async (queue: Queue, jobId: string): Promise<JobSummary> => {
    const job: Job<JobData, JobResult> | undefined = await queue.getJob(jobId);
    logger.debug({ job }, 'Got job');

    if (!(job && job.id != undefined)) {
      throw new JobNotFoundError(`Job ${jobId} not found`, jobId);
    }

    let transactionIds: string[];
    if (job.data && job.data.transactionIds) {
      transactionIds = job.data.transactionIds;
    } else {
      transactionIds = [];
    }

    let transactionError;
    let transactionPayload;
    const returnValue = job.returnvalue;
    if (returnValue) {
      if (returnValue.transactionError) {
        transactionError = returnValue.transactionError;
      }

      if (returnValue.transactionPayload && returnValue.transactionPayload.length > 0) {
        transactionPayload = returnValue.transactionPayload.toString();
      } else {
        transactionPayload = '';
      }
    }

    return {
      jobId: job.id,
      transactionIds,
      transactionError,
      transactionPayload,
    };
  };

  public updateJobData = async (
    job: Job<JobData, JobResult>,
    transaction: Transaction | undefined
  ): Promise<void> => {
    const newData = { ...job.data };

    if (transaction != undefined) {
      newData.transactionIds = ([] as string[]).concat(newData.transactionIds, transaction.getTransactionId());

      newData.transactionState = transaction.serialize();
    } else {
      newData.transactionState = undefined;
    }

    await job.update(newData);
  };

  public getJobCounts = async (queue: Queue): Promise<{ [index: string]: number }> => {
    const jobCounts = await queue.getJobCounts('active', 'completed', 'delayed', 'failed', 'waiting');
    logger.debug({ jobCounts }, 'Current job counts');

    return jobCounts;
  };

  private processSubmitTransactionJob = async (
    fabricSvc: Fabric,
    job: Job<JobData, JobResult>
  ): Promise<JobResult> => {
    logger.debug({ jobId: job.id, jobName: job.name }, 'Processing job');
    const contract = fabricSvc.contracts.docNotarizationContract as Contract;
    if (contract === undefined) {
      logger.error({ jobId: job.id, jobName: job.name }, 'Contract not found for MSP ID %s', job.data.mspid);

      // Retrying will never work without a contract, so give up with an
      // empty job result
      return {
        transactionError: undefined,
        transactionPayload: undefined,
      };
    }

    const args = job.data.transactionArgs;
    let transaction: Transaction;

    if (job.data.transactionState) {
      const savedState = job.data.transactionState;
      logger.debug(
        {
          jobId: job.id,
          jobName: job.name,
          savedState,
        },
        'Reusing previously saved transaction state'
      );

      transaction = contract.deserializeTransaction(savedState);
    } else {
      logger.debug(
        {
          jobId: job.id,
          jobName: job.name,
        },
        'Using new transaction'
      );

      transaction = contract.createTransaction(job.data.transactionName);
      await this.updateJobData(job, transaction);
    }

    logger.debug(
      {
        jobId: job.id,
        jobName: job.name,
        transactionId: transaction.getTransactionId(),
      },
      'Submitting transaction'
    );

    try {
      const payload = await fabricSvc.submitTransaction(transaction, ...args);

      return {
        transactionError: undefined,
        transactionPayload: payload,
      };
    } catch (err) {
      const retryAction = getRetryAction(err);

      if (retryAction === RetryAction.None) {
        logger.error({ jobId: job.id, jobName: job.name, err }, 'Fatal transaction error occurred');

        // Not retriable so return a job result with the error details
        return {
          transactionError: `${err}`,
          transactionPayload: undefined,
        };
      }

      logger.warn({ jobId: job.id, jobName: job.name, err }, 'Retryable transaction error occurred');

      if (retryAction === RetryAction.WithNewTransactionId) {
        logger.debug({ jobId: job.id, jobName: job.name }, 'Clearing saved transaction state');
        await this.updateJobData(job, undefined);
      }

      // Rethrow the error to keep retrying
      throw err;
    }
  };
}

export default Redis;
