import { logger } from '../utilities/logger';
import { Queue } from 'bullmq';
import { getJobCounts } from '../services/jobs.service';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import * as config from '../config/config';
import { Contract } from 'fabric-network';
import { getBlockHeight } from '../services/fabric.service';

const { SERVICE_UNAVAILABLE, OK } = StatusCodes;

class HealthController {
  public isReady = async (req: Request, res: Response) => {
    res.status(OK).json({
      status: getReasonPhrase(OK),
      timestamp: new Date().toISOString(),
    });
  };

  public isLive = async (req: Request, res: Response) => {
    try {
      const submitQueue = req.app.locals.jobq as Queue;
      const qsccOrg = req.app.locals[config.MSPID]?.qsccContract as Contract;

      await Promise.all([getBlockHeight(qsccOrg), getJobCounts(submitQueue)]);
    } catch (err) {
      logger.error({ err }, 'Error processing liveness request');

      return res.status(SERVICE_UNAVAILABLE).json({
        status: getReasonPhrase(SERVICE_UNAVAILABLE),
        timestamp: new Date().toISOString(),
      });
    }
  };
}

export default HealthController;
