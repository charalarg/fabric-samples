/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import passport from 'passport';
import pinoMiddleware from 'pino-http';
import { authenticateApiKey, fabricAPIKeyStrategy } from './middlewares/auth';
import { healthRouter } from './routers/health.router';
import { jobsRouter } from './routers/jobs.router';
import { logger } from './logger';
import { transactionsRouter } from './routers/transactions.router';
import { documentsRouter } from './routers/documents.router';
import { usersRouter } from './routers/users.router';
import fileUpload from 'express-fileupload';

const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = StatusCodes;

export const createServer = async (): Promise<Application> => {
  const app = express();

  app.use(
    pinoMiddleware({
      logger,
      customLogLevel: function customLogLevel(res, err) {
        if (
          res.statusCode >= BAD_REQUEST &&
          res.statusCode < INTERNAL_SERVER_ERROR
        ) {
          return 'warn';
        }
        if (res.statusCode >= INTERNAL_SERVER_ERROR || err) {
          return 'error';
        }
        return 'debug';
      },
    })
  );

  app.use(
    express.json({
      verify: (req: Request, res: Response, buf: Buffer) => {
        try {
          JSON.parse(buf.toString());
        } catch (e) {
          return res.status(BAD_REQUEST).json({
            status: getReasonPhrase(BAD_REQUEST),
            reason: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            timestamp: new Date().toISOString(),
            errors: 'Wrong JSON format',
          });
        }
      },
    })
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(
    fileUpload({
      limits: { fileSize: 50 * 1024 * 1024 },
    })
  );
  passport.use(fabricAPIKeyStrategy);
  app.use(passport.initialize());

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
  }

  app.use('/', healthRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/jobs', authenticateApiKey, jobsRouter);
  app.use('/api/documents', authenticateApiKey, documentsRouter);
  app.use('/api/transactions', authenticateApiKey, transactionsRouter);

  app.use((_req, res) =>
    res.status(NOT_FOUND).json({
      status: getReasonPhrase(NOT_FOUND),
      timestamp: new Date().toISOString(),
    })
  );

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};
