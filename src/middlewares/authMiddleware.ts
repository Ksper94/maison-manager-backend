import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt'; // <-- remplacer 'verifyToken' par 'verifyAccessToken'

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

    // On vérifie le token en tant qu'access token
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('[authMiddleware] Erreur de token :', error);
    return res.status(401).json({ message: 'Échec d’authentification' });
  }
};
