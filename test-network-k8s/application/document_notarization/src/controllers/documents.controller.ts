import { logger } from '../utilities/logger';
import { Queue } from 'bullmq';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const { INTERNAL_SERVER_ERROR, ACCEPTED, OK, NOT_FOUND } = StatusCodes;
import { Request, Response } from 'express';
import { KEYUTIL, KJUR, X509 } from 'jsrsasign';
import fs from 'fs';
import * as crypto from 'crypto';
import * as config from '../config/config';
import { Contract } from 'fabric-network';
import { AssetNotFoundError } from '../utilities/errors';
import User from '../services/users.service';
import Redis from '../services/redis.service';
import UserModel, { Role } from '../models/user.model';

export type DocType = {
  Key: string;
  Record: Record<string, unknown>;
  transaction_ids: string[];
};

class DocumentsController {
  public createDocument = async (req: Request, res: Response) => {
    const user = req.user as User;
    const redis = Redis.getInstance();
    const userId = user.userId as string;
    const mspId = user.mspId as string;
    // const files = req.files as Record<string, unknown>;
    const clientId = req.body.clientId as string;
    const mongoUser = await UserModel.findByUserId(clientId);
    const title = req.body.title as string;
    const expires = req.body.expires as string;
    // const document = files.document as Record<string, unknown>;
    // const documentHash = document ? (document.md5 as string) : crypto.randomBytes(32).toString('hex');
    const documentHash = crypto.randomBytes(16).toString('hex');
    const userCredentials = await user.loadUserCredentials();
    const privateKey = userCredentials.privateKey as string;
    const certificate = userCredentials.certificate as string;

    const sig = new KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
    sig.init(privateKey, '');
    sig.updateHex(documentHash);
    const sigValueHex = sig.sign();
    const sigValueBase64 = Buffer.from(sigValueHex, 'hex').toString('base64');

    try {
      const submitQueue = redis.jobQueue as Queue;
      const jobId = await redis.addSubmitTransactionJob(
        submitQueue,
        mspId,
        'issueCertificate',
        documentHash,
        userId,
        mspId,
        certificate,
        sigValueBase64,
        clientId,
        mongoUser.name as string,
        mongoUser.surname as string,
        (mongoUser.dateOfBirth as Date).toISOString().split('T')[0],
        new Date().getTime().toString(),
        title,
        Date.parse(expires).toString()
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

    // const files = req.files as Record<string, unknown>;
    // const document = files.document as Record<string, unknown>;
    // const documentHash = document.md5 as string;
    const documentHash = req.body.document as string;
    const caCert = fs.readFileSync(config.fabricCaCertPath, 'utf8');
    const contract = user.fabricSvc.contracts.docNotarizationContract as Contract;

    try {
      const data = await user.fabricSvc.evaluateTransaction(contract, 'queryDocumentByHash', documentHash);
      const documents = JSON.parse(data.toString());

      if (!documents.length) {
        return res.status(NOT_FOUND).json({
          status: getReasonPhrase(NOT_FOUND),
          timestamp: new Date().toISOString(),
        });
      }
      const documentBody = documents.slice(-1)[0];
      const document = documentBody.Record;
      const transaction_ids = documentBody.transaction_ids;

      const docIssuerCert = document.certificate as string;
      delete document.certificate;

      const certObj = new X509();
      certObj.readCertPEM(docIssuerCert);

      const userPublicKey = KEYUTIL.getKey(docIssuerCert);
      const recover = new KJUR.crypto.Signature({ alg: 'SHA256withECDSA' });
      recover.init(userPublicKey);
      recover.updateHex(documentHash);
      const getBackSigValueHex = new Buffer(document.signature, 'base64').toString('hex');

      return res.status(OK).json({
        subject: certObj.getSubjectString(),
        subjects_issuer_ca: certObj.getIssuerString(),
        ca_signature_validation: certObj.verifySignature(KEYUTIL.getKey(caCert)),
        verified_document: recover.verify(getBackSigValueHex),
        expired: document.expires < Date.now().toString(),
        signature: document.signature,
        document: document,
        transaction_ids: transaction_ids,
      });
    } catch (err) {
      logger.error({ err }, 'Error processing read document request for document ID %s', documentHash);
      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  };

  public revokeDocument = async (req: Request, res: Response) => {
    const user = req.user as User;
    const documentHash = req.body.document as string;
    const redis = Redis.getInstance();
    const mspId = user.mspId as string;

    try {
      const submitQueue = redis.jobQueue as Queue;
      const jobId = await redis.addSubmitTransactionJob(submitQueue, mspId, 'revokeCertificate', documentHash);

      return res.status(ACCEPTED).json({
        status: getReasonPhrase(ACCEPTED),
        jobId: jobId,
        documentHash: documentHash,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'Error processing revoke document request for document ID %s', documentHash);

      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  };

  public getDocuments = async (req: Request, res: Response) => {
    const roleToTransactionMap: { [index: string]: string } = {
      Admin: 'queryDocumentsByIssuer',
      User: 'queryDocumentsByClient',
    };

    try {
      const clientFilter = req.params.client ? req.params.client : '';
      const user = req.user as User;
      const userRole = user.role as Role;
      const transactionName = roleToTransactionMap[userRole];
      const contract = user.fabricSvc.contracts.docNotarizationContract as Contract;
      const data = await user.fabricSvc.evaluateTransaction(
        contract,
        transactionName,
        user.userId,
        clientFilter
      );
      const documents = JSON.parse(data.toString());
      documents.map((doc: DocType) => delete doc.Record.certificate);

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
