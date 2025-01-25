import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

interface CustomRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Accès refusé, token manquant' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token invalide' });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId; // On assigne l'userId pour l'utiliser ensuite
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};
