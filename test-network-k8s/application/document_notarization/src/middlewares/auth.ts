/*
 * SPDX-License-Identifier: Apache-2.0
 */

import passport from 'passport';
import { NextFunction, Request, Response } from 'express';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import * as config from '../config/config';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { logger } from '../utilities/logger';
import User from '../services/users.service';

const { UNAUTHORIZED } = StatusCodes;

export const fabricAPIKeyStrategy: HeaderAPIKeyStrategy = new HeaderAPIKeyStrategy(
  { header: 'X-API-Key', prefix: '' },
  false,
  async function (apikey, done) {
    try {
      const userJwt = jwt.verify(apikey, config.JwtSecret) as JwtPayload;

      const user = new User(userJwt.userId, userJwt.mspId);
      await user.init();

      if (config.mspid != userJwt.mspId) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      logger.error('--------------------' + error);
      return done(null, false);
    }
  }
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: User, done) => {
  done(null, user);
});

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('headerapikey', { session: true }, (err, user, _info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(UNAUTHORIZED).json({
        status: getReasonPhrase(UNAUTHORIZED),
        reason: 'NO_VALID_APIKEY',
        timestamp: new Date().toISOString(),
      });
    }

    req.logIn(user, { session: false }, async (err) => {
      if (err) {
        return next(err);
      }
      return next();
    });
  })(req, res, next);
};

export const generateAuthToken = async (userId: string, mspId: string): Promise<string> => {
  return jwt.sign({ userId: userId, mspId: mspId }, config.JwtSecret);
};
