import { logger } from '../utilities/logger';
import { Queue } from 'bullmq';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const { INTERNAL_SERVER_ERROR, ACCEPTED, OK, NOT_FOUND } = StatusCodes;
import { Request, Response } from 'express';
import { KEYUTIL, KJUR, X509 } from 'jsrsasign';
import fs from 'fs';
import * as config from '../config/config';
import { Contract } from 'fabric-network';
import { AssetNotFoundError } from '../utilities/errors';
import User from '../services/users.service';
import Redis from '../services/redis.service';

class DocumentsController {
  public createDocument = async (req: Request, res: Response) => {
    const user = req.user as User;
    const redis = Redis.getInstance();
    const userId = user.userId as string;
    const mspId = user.mspId as string;
    const files = req.files as Record<string, unknown>;
    const document = files.document as Record<string, unknown>;
    const documentHash = document.md5 as string;
    const userCredentials = await user.loadUserCredentials();
    const privateKey = userCredentials.privateKey as string;

    const sig = new KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
    sig.init(privateKey, '');
    sig.updateHex(documentHash);
    const sigValueHex = sig.sign();
    const sigValueBase64 = new Buffer(sigValueHex, 'hex').toString('base64');

    try {
      const submitQueue = redis.jobQueue as Queue;
      const jobId = await redis.addSubmitTransactionJob(
        submitQueue,
        mspId,
        'issue',
        documentHash,
        userId,
        mspId,
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
  };

  public validateDocument = async (req: Request, res: Response) => {
    const user = req.user as User;
    // const docIssuerId = req.body.docIssuerId as string;

    const files = req.files as Record<string, unknown>;
    const document = files.document as Record<string, unknown>;
    const documentHash = document.md5 as string;
    const caCert = fs.readFileSync(config.fabricCaCertPath, 'utf8');
    const contract = user.fabricSvc.contracts.docNotarizationContract as Contract;

    try {
      const data = await user.fabricSvc.evaluateTransaction(contract, 'queryDoc', documentHash);
      const documents = JSON.parse(data.toString());

      if (!documents.length) {
        return res.status(NOT_FOUND).json({
          status: getReasonPhrase(NOT_FOUND),
          timestamp: new Date().toISOString(),
        });
      }
      const document = documents.slice(-1)[0];

      // TODO create doc issuer object
      // TODO load doc issuer credentials
      // const docIssuerCert = docIssuerCredentials ? (docIssuerCredentials.certificate as string) : '';
      // const certObj = new X509();
      // certObj.readCertPEM(docIssuerCert);

      // const userPublicKey = KEYUTIL.getKey(docIssuerCert);
      // const recover = new KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
      // recover.init(userPublicKey);
      // recover.updateHex(documentHash);
      // const getBackSigValueHex = new Buffer(document.signature, 'base64').toString('hex');

      return res.status(OK).json({
        // subject: certObj.getSubjectString(),
        // subjects_issuer_ca: certObj.getIssuerString(),
        // ca_signature_validation: certObj.verifySignature(KEYUTIL.getKey(caCert)),
        // verified_document: recover.verify(getBackSigValueHex),
        signature: document.signature,
      });
    } catch (err) {
      logger.error({ err }, 'Error processing read document request for document ID %s', documentHash);
      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  };

  public getDocument = async (req: Request, res: Response) => {
    const documentHash = req.params.documentHash;
    try {
      const user = req.user as User;
      const contract = user.fabricSvc.contracts.docNotarizationContract as Contract;
      const data = await user.fabricSvc.evaluateTransaction(contract, 'queryDoc', documentHash);
      const documents = JSON.parse(data.toString());

      return res.status(OK).json(documents);
    } catch (err) {
      logger.error({ err }, 'Error processing read document request for document ID %s');

      if (err instanceof AssetNotFoundError) {
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

export default DocumentsController;
