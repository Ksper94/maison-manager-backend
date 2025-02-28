import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt'; // Utilise bien la fonction verifyAccessToken

/**
 * On étend l'interface Request pour y ajouter la propriété userId.
 */
interface CustomRequest extends Request {
  userId?: string;
}

/**
 * Middleware d'authentification :
 * - Récupère le token dans l'en-tête Authorization
 * - Vérifie sa validité
 * - Extrait l'ID utilisateur (userId) s’il est valide
 * - Le stocke dans req.userId pour la suite
 */
export const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Accès refusé, token manquant' });
    }

    // On récupère uniquement la deuxième partie du header "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token invalide' });
    }

    // Vérifie et décode le token (JWT)
    const decoded = verifyAccessToken(token);

    // On s’assure que le token contient bien un userId
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }

    // On injecte le userId dans la requête pour l’utiliser dans les contrôleurs
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error('[authMiddleware] Erreur de token :', error);
    return res.status(401).json({ message: 'Échec d’authentification' });
  }
};
