import { logger } from '../utilities/logger';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } = StatusCodes;
import { Request, Response } from 'express';
import { getTransactionValidationCode } from '../services/fabric.service';
import { Contract } from 'fabric-network';
import { TransactionNotFoundError } from '../utilities/errors';

class TransactionsController {
  public getTransaction = async (req: Request, res: Response) => {
    const mspId = req.user as string;
    const transactionId = req.params.transactionId;
    logger.debug('Read request received for transaction ID %s', transactionId);

    try {
      const qsccContract = req.app.locals[mspId]?.qsccContract as Contract;
      const validationCode = await getTransactionValidationCode(qsccContract, transactionId);

      return res.status(OK).json({
        transactionId,
        validationCode,
      });
    } catch (err) {
      if (err instanceof TransactionNotFoundError) {
        return res.status(NOT_FOUND).json({
          status: getReasonPhrase(NOT_FOUND),
          timestamp: new Date().toISOString(),
        });
      } else {
        logger.error({ err }, 'Error processing read request for transaction ID %s', transactionId);

        return res.status(INTERNAL_SERVER_ERROR).json({
          status: getReasonPhrase(INTERNAL_SERVER_ERROR),
          timestamp: new Date().toISOString(),
        });
      }
    }
  };
}

export default TransactionsController;
