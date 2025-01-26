import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

interface CustomRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Accès refusé, token manquant' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token invalide' });
    }

    // Vérification du token
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }

    req.userId = decoded.userId; // Injecter l'ID utilisateur dans la requête
    next();
  } catch (error) {
    console.error('[authMiddleware] Erreur de token :', error);
    return res.status(401).json({ message: 'Échec d’authentification' });
  }
};
