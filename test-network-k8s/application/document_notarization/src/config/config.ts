/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The sample REST server can be configured using the environment variables
 * documented below
 *
 * In a local development environment, these variables can be loaded from a
 * .env file by starting the server with the following command:
 *
 *   npm start:dev
 *
 * The scripts/generateEnv.sh script can be used to generate a suitable .env
 * file for the Fabric Test Network
 */

import * as env from 'env-var';

export const ORG = 'Org1';
export const JOB_QUEUE_NAME = 'submit';
export const MSPID = ORG + 'MSP';
export const caHostName = 'org1-ecert-ca';
export const JwtSecret = 'FB8D522BD9B6C38D4C8EC2D7A04BC3FF3A54';
export const maxFileSize = 50 * 1024 * 1024;
/*
 * Log level for the REST server
 */
export const logLevel = env
  .get('log_level')
  .default('debug')
  .asEnum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

/*
 * The port to start the REST server on
 */
export const port = env.get('PORT').default('3000').example('3000').asPortNumber();

/*
 * The type of backoff to use for retrying failed submit jobs
 */
export const submitJobBackoffType = env
  .get('SUBMIT_JOB_BACKOFF_TYPE')
  .default('fixed')
  .asEnum(['fixed', 'exponential']);

/*
 * Backoff delay for retrying failed submit jobs in milliseconds
 */
export const submitJobBackoffDelay = env
  .get('SUBMIT_JOB_BACKOFF_DELAY')
  .default('3000')
  .example('3000')
  .asIntPositive();

/*
 * The total number of attempts to try a submit job until it completes
 */
export const submitJobAttempts = env.get('SUBMIT_JOB_ATTEMPTS').default('5').example('5').asIntPositive();

/*
 * The maximum number of submit jobs that can be processed in parallel
 */
export const submitJobConcurrency = env.get('SUBMIT_JOB_CONCURRENCY').default('5').example('5').asIntPositive();

/*
 * The number of completed submit jobs to keep
 */
export const maxCompletedSubmitJobs = env
  .get('MAX_COMPLETED_SUBMIT_JOBS')
  .default('1000')
  .example('1000')
  .asIntPositive();

/*
 * The number of failed submit jobs to keep
 */
export const maxFailedSubmitJobs = env
  .get('MAX_FAILED_SUBMIT_JOBS')
  .default('1000')
  .example('1000')
  .asIntPositive();

/*
 * Whether to initialise a scheduler for the submit job queue
 * There must be at least on queue scheduler to handle retries and you may want
 * more than one for redundancy
 */
export const submitJobQueueScheduler = env
  .get('SUBMIT_JOB_QUEUE_SCHEDULER')
  .default('true')
  .example('true')
  .asBoolStrict();

export const asLocalhost = env.get('as_local_host').default('false').example('true').asBoolStrict();

export const channelName = env.get('fabric_channel').default('mychannel').example('mychannel').asString();

export const chaincodeName = env.get('fabric_contract').default('basic').example('basic').asString();

export const chaincodeId = env.get('fabric_contract_id').default('-').example('-').asString();

export const commitTimeout = env.get('HLF_COMMIT_TIMEOUT').default('300').example('300').asIntPositive();

export const endorseTimeout = env.get('HLF_ENDORSE_TIMEOUT').default('30').example('30').asIntPositive();

export const queryTimeout = env.get('HLF_QUERY_TIMEOUT').default('3').example('3').asIntPositive();

export const redisHost = env.get('REDIS_HOST').default('localhost').example('localhost').asString();

export const redisPort = env.get('REDIS_PORT').default('6379').example('6379').asPortNumber();

export const redisUsername = env.get('REDIS_USERNAME').example('fabric').asString();

export const redisPassword = env.get('REDIS_PASSWORD').asString();

export const fabricWalletDir = env
  .get('fabric_wallet_dir')
  .default('/fabric/application/wallet')
  .example('/path/to/wallets')
  .asString();

export const fabricGatewayDir = env
  .get('fabric_gateway_dir')
  .default('/fabric/application/gateway')
  .example('/path/to/gateway')
  .asString();

export const fabric_ccp_name = env
  .get('fabric_ccp_name')
  .default('org1_ccp.json')
  .example('org1_ccp.json')
  .asString();

export const fabricGatewayTlsCertPath = env
  .get('fabric_gateway_tlsCertPath')
  .default('/fabric/tlscacerts/org1-tls-ca.pem')
  .example('/path/to/tlscsert')
  .asString();

export const fabricCaCertPath = env
  .get('fabric_ca_cert')
  .default('/fabric/cacerts/org1-ecert-ca.pem')
  .example('/fabric/cacerts/org1-ecert-ca.pem')
  .asString();

export const fabricGatewayHostport = env
  .get('fabric_gateway_hostport')
  .default('org1-peer-gateway-svc:7051')
  .asString();

export const fabricGatewaySslHostOverride = env
  .get('fabric_gateway_sslHostOverride')
  .default('org1-peer-gateway-svc')
  .asString();

export const fabricAppAdmin = env.get('fabric_app_admin').default('org1-admin').example('org1-admin').asString();
