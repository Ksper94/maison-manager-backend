// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Une erreur interne est survenue';

  res.status(statusCode).json({
    message: message,
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
}
