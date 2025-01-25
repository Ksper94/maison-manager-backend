import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);
  return res.status(500).json({
    message: 'Une erreur interne est survenue',
    error: err.message || err
  });
}
