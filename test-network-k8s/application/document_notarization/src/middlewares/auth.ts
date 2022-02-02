/*
 * SPDX-License-Identifier: Apache-2.0
 */

import passport from 'passport';
import { NextFunction, Request, Response } from 'express';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import * as config from '../config/config';
import { Identity } from 'fabric-network';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { logger } from '../utilities/logger';

const { UNAUTHORIZED } = StatusCodes;

export const fabricAPIKeyStrategy: HeaderAPIKeyStrategy = new HeaderAPIKeyStrategy(
  { header: 'X-API-Key', prefix: '' },
  false,
  function (apikey, done) {
    try {
      const user = jwt.verify(apikey, config.JwtSecret) as JwtPayload;
      if (config.MSPID != user.mspId) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      return done(null, false);
    }
  }
);

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('headerapikey', { session: false }, (err, user, _info) => {
    if (err) return next(err);
    logger.info('USER ' + JSON.stringify(user));

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

export const generateAuthToken = async (userId: string, userIdentity: Identity | ''): Promise<string> => {
  return jwt.sign(
    {
      userId: userId,
      mspId: userIdentity ? userIdentity.mspId : undefined,
    },
    config.JwtSecret
  );
};
