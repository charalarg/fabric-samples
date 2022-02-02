/*
 * SPDX-License-Identifier: Apache-2.0
 */

import pino from 'pino';
import * as config from '../config/config';
import { StatusCodes } from 'http-status-codes';
import { ServerResponse } from 'http';
import pinoMiddleware from 'pino-http';

const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = StatusCodes;

export const logger = pino({
  level: config.logLevel,
});

export const loggerMiddleware = pinoMiddleware({
  logger,
  customLogLevel: (res: ServerResponse, err: Error) => {
    if (res.statusCode >= BAD_REQUEST && res.statusCode < INTERNAL_SERVER_ERROR) {
      return 'warn';
    }
    if (res.statusCode >= INTERNAL_SERVER_ERROR || err) {
      return 'error';
    }
    return 'debug';
  },
});
