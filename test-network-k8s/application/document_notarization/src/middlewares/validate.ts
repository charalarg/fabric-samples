import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

const { BAD_REQUEST } = StatusCodes;

export const validateStructure = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<unknown> => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(BAD_REQUEST).json({
      status: getReasonPhrase(BAD_REQUEST),
      reason: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      timestamp: new Date().toISOString(),
      errors: result.array(),
    });
  }

  return next();
};
