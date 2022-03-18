import { logger } from '../utilities/logger';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const { INTERNAL_SERVER_ERROR, ACCEPTED, UNAUTHORIZED, CREATED } = StatusCodes;
import { Request, Response } from 'express';
import { generateAuthToken } from '../middlewares/auth';
import User from '../services/users.service';
import * as config from '../config/config';
import UserModel, { Role } from '../models/user.model';

class UsersController {
  public login = async (req: Request, res: Response) => {
    const userId = req.body.userId;
    const password = req.body.password;

    try {
      const userModel = await UserModel.findByCredentials(userId, password);

      if (userModel) {
        const token = await generateAuthToken(userId, config.mspid, userModel.role);

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

  public registerAdmin = async (req: Request, res: Response) => {
    const orgAdmin = req.user as User;
    const userId = req.body.userId;
    const password = req.body.password;

    try {
      await orgAdmin.fabricSvc.registerAndEnrollUser(userId);
      await UserModel.createUser(userId, password, Role.Admin);

      return res.status(CREATED).json({
        status: getReasonPhrase(CREATED),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'Error processing registerAdmin request for user %s', userId);

      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  };
}

export default UsersController;
