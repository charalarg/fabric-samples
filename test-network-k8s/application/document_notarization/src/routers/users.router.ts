/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This sample is intended to work with the basic document transfer
 * chaincode which imposes some constraints on what is possible here.
 *
 * For example,
 *  - There is no validation for Document IDs
 *  - There are no error codes from the chaincode
 *
 * To avoid timeouts, long running tasks should be decoupled from HTTP request
 * processing
 *
 * Submit transactions can potentially be very long running, especially if the
 * transaction fails and needs to be retried one or more times
 *
 * To allow requests to respond quickly enough, this sample queues submit
 * requests for processing asynchronously and immediately returns 202 Accepted
 */
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { logger } from '../logger';
import { validateStructure } from '../middlewares/validate';
import { loadUserIdentity } from '../fabric';
import { Md5 } from 'ts-md5';
import { generateAuthToken } from '../middlewares/auth';
import { loadIdentity } from '../middlewares/wallet';
import { KJUR } from 'jsrsasign';
import { Queue } from 'bullmq';
import { addSubmitTransactionJob } from '../jobs';
import { documentsRouter } from './documents.router';
const { ACCEPTED, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = StatusCodes;
export const usersRouter = express.Router();

usersRouter.post(
  '/login',
  body().isObject({ strict: true }),
  body('userId', 'must be a string').notEmpty(),
  body('password', 'must be a string').notEmpty(),
  validateStructure,
  async (req: Request, res: Response) => {
    logger.debug(req.body, 'Login request received');

    const userId = req.body.userId;
    const password = req.body.password;

    try {
      const userIdentity = (await loadUserIdentity(userId)) || '';

      const hashedIdentity = Md5.hashStr(JSON.stringify(userIdentity));
      logger.info(hashedIdentity);

      if (hashedIdentity == password) {
        const token = await generateAuthToken(userId, userIdentity);

        return res.status(ACCEPTED).json({
          status: getReasonPhrase(ACCEPTED),
          timestamp: new Date().toISOString(),
          token,
        });
      } else {
        return res.status(UNAUTHORIZED).json({
          status: getReasonPhrase(UNAUTHORIZED),
          reason: 'WRONG_CREDENTIALS',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error processing login request for user %s', userId);

      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  }
);

documentsRouter.post('/', validateStructure, loadIdentity, async (req: Request, res: Response) => {
  const user = req.user as Record<string, unknown>;
  const userId = user.userId as string;
  const mspId = user.mspId as string;

  const files = req.files as Record<string, unknown>;
  const document = files.document as Record<string, unknown>;
  const documentHash = document.md5 as string;
  const userIdentity = res.locals.userIdentity;
  const privateKey = userIdentity.credentials.privateKey;

  const sig = new KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
  sig.init(privateKey, '');
  sig.updateHex(documentHash);
  const sigValueHex = sig.sign();
  const sigValueBase64 = new Buffer(sigValueHex, 'hex').toString('base64');

  try {
    const submitQueue = req.app.locals.jobq as Queue;
    const jobId = await addSubmitTransactionJob(
      submitQueue,
      mspId,
      'issue',
      documentHash,
      userId,
      sigValueBase64,
      new Date().toISOString()
    );

    return res.status(ACCEPTED).json({
      status: getReasonPhrase(ACCEPTED),
      jobId: jobId,
      documentHash: documentHash,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'Error processing create document request for document ID %s', documentHash);

    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  }
});
