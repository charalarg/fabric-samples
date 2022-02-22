import { logger } from '../utilities/logger';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const { INTERNAL_SERVER_ERROR, ACCEPTED, UNAUTHORIZED } = StatusCodes;
import { Request, Response } from 'express';
import { generateAuthToken } from '../middlewares/auth';
import User from '../services/users.service';
import * as config from '../config/config';

class UsersController {
  private user: User | undefined;

  constructor() {
    this.user = undefined;
  }

  public login = async (req: Request, res: Response) => {
    const userId = req.body.userId;
    const password = req.body.password;

    try {
      // TODO auta prepei na elegxontai apo mia DB
      if (password == 'x' && config.mspid == 'Org1MSP') {
        const user = new User(userId, config.mspid);
        await user.init();
        const token = await generateAuthToken(userId, 'Org1MSP');

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
  };
}

export default UsersController;
