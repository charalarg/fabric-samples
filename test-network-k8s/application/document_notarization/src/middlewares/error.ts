import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

const { BAD_REQUEST, NOT_FOUND } = StatusCodes;

export const internalServerError = async (req: Request, res: Response, next: NextFunction): Promise<unknown> => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(BAD_REQUEST).json({
      status: getReasonPhrase(BAD_REQUEST),
      message: 'Not found',
      timestamp: new Date().toISOString(),
      errors: result.array(),
    });
  }

  return next();
};

export const notFoundError = async (req: Request, res: Response, next: NextFunction): Promise<unknown> => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(NOT_FOUND).json({
      status: getReasonPhrase(NOT_FOUND),
      message: 'Invalid request body',
      timestamp: new Date().toISOString(),
      errors: result.array(),
    });
  }

  return next();
};
