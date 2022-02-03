import { logger } from '../utilities/logger';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const { INTERNAL_SERVER_ERROR, ACCEPTED, UNAUTHORIZED } = StatusCodes;
import { Request, Response } from 'express';
import { loadUserIdentity } from '../services/fabric.service';
import { Md5 } from 'ts-md5';
import { generateAuthToken } from '../middlewares/auth';

class UsersController {
  public login = async (req: Request, res: Response) => {
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
  };
}

export default UsersController;
