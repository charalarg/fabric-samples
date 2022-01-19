/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This is the main entrypoint for the sample REST server, which is responsible
 * for connecting to the Fabric network and setting up a job queue for
 * processing submit transactions
 *
 * You can find more details related to the Fabric aspects of the sample in the
 * following files:
 *
 *   - errors.ts
 *     Fabric transaction error handling and retry logic
 *   - fabric.ts
 *     all the sample code which interacts with the Fabric SDK
 *
 * The remaining files are related to the REST server aspects of the sample,
 * rather than Fabric itself:
 *
 *   - *.router.ts
 *     details of the REST endpoints provided by the sample
 *   - auth.ts
 *     basic API key authentication strategy used for the sample
 *   - config.ts
 *     descriptions of all the available configuration environment variables
 *   - jobs.ts
 *     job queue implementation details
 *   - logger.ts
 *     logging implementation details
 *   - redis.ts
 *     redis implementation details
 *   - server.ts
 *     express server implementation details
 */

import * as config from './config';
import { buildCCP, createGateway, getContracts, getNetwork, loadUserWallet } from './fabric';
import { initJobQueue, initJobQueueScheduler, initJobQueueWorker } from './jobs';
import { logger } from './logger';
import { createServer } from './server';
import { isMaxmemoryPolicyNoeviction } from './redis';
import { Queue, QueueScheduler, Worker } from 'bullmq';
let jobQueue: Queue | undefined;
let jobQueueWorker: Worker | undefined;
let jobQueueScheduler: QueueScheduler | undefined;

async function main() {
  logger.info('Checking Redis config');
  if (!(await isMaxmemoryPolicyNoeviction())) {
    throw new Error(
      'Invalid redis configuration: redis instance must have the setting maxmemory-policy=noeviction'
    );
  }
  const app = await createServer();
  const adminWallet = await loadUserWallet();

  const org1CCP = buildCCP();
  const AdminGateway = await createGateway(org1CCP, config.fabricAppAdmin, adminWallet);
  const networkOrg = await getNetwork(AdminGateway);
  const contractsOrg = await getContracts(networkOrg);
  app.locals[config.MSPID] = contractsOrg;

  jobQueue = initJobQueue();
  jobQueueWorker = initJobQueueWorker(app);
  if (config.submitJobQueueScheduler) {
    jobQueueScheduler = initJobQueueScheduler();
  }
  app.locals.jobq = jobQueue;

  app.listen(config.port, () => {
    logger.info('REST server started on port %d', config.port);
  });
}

main().catch(async (err) => {
  logger.error({ err }, 'Unxepected error');

  if (jobQueueScheduler != undefined) {
    logger.debug('Closing job queue scheduler');
    await jobQueueScheduler.close();
  }

  if (jobQueueWorker != undefined) {
    logger.debug('Closing job queue worker');
    await jobQueueWorker.close();
  }

  if (jobQueue != undefined) {
    logger.debug('Closing job queue');
    await jobQueue.close();
  }
});
