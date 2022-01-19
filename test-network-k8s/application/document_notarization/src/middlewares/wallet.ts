import { NextFunction, Request, Response } from 'express';
import { loadUserIdentity } from '../fabric';

export const loadIdentity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<unknown> => {
  const user = req.user as Record<string, unknown>;
  const userId = user.userId as string;
  const userIdentity = await loadUserIdentity(userId);
  res.locals.userIdentity = userIdentity;
  return next();
};
