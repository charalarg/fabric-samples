import { logger } from '../utilities/logger';
import { Queue } from 'bullmq';
import Redis from '../services/redis.service';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } = StatusCodes;
import { Request, Response } from 'express';
import { JobNotFoundError } from '../utilities/errors';

class JobsController {
  public getJob = async (req: Request, res: Response) => {
    const jobId = req.params.jobId;
    const redis = Redis.getInstance();
    logger.debug('Read request received for job ID %s', jobId);

    try {
      const submitQueue = redis.jobQueue as Queue;
      const jobSummary = await redis.getJobSummary(submitQueue, jobId);

      return res.status(OK).json(jobSummary);
    } catch (err) {
      logger.error({ err }, 'Error processing read request for job ID %s', jobId);

      if (err instanceof JobNotFoundError) {
        return res.status(NOT_FOUND).json({
          status: getReasonPhrase(NOT_FOUND),
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  };
}

export default JobsController;
