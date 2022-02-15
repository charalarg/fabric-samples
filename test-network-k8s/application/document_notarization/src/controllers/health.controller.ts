import { logger } from '../utilities/logger';
import { Queue } from 'bullmq';
import Redis from '../services/redis.service';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { Contract } from 'fabric-network';
import User from '../services/users.service';

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
      const user = req.user as User;
      const redis = Redis.getInstance();
      const submitQueue = redis.jobQueue as Queue;
      const qscc = user.fabricSvc.contracts.qsccContract as Contract;

      await Promise.all([user.fabricSvc.getBlockHeight(qscc), redis.getJobCounts(submitQueue)]);
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
