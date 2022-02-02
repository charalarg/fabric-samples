import { NextFunction, Request, Response } from 'express';
import { loadUserIdentity } from '../services/fabric.service';

export const loadIdentity = async (req: Request, res: Response, next: NextFunction): Promise<unknown> => {
  const user = req.user as Record<string, unknown>;
  const userId = user.userId as string;
  res.locals.userIdentity = await loadUserIdentity(userId);
  return next();
};
