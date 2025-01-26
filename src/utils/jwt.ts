import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';

interface CustomJwtPayload extends JwtPayload {
  userId: string; // Ajout d'un champ personnalisé pour votre application
}

export const generateToken = (payload: CustomJwtPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): CustomJwtPayload => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as CustomJwtPayload;

    if (!decoded.userId) {
      throw new Error('Token invalide : userId manquant');
    }

    return decoded;
  } catch (error) {
    console.error('[verifyToken] Erreur de validation du token :', error);
    throw new Error('Token invalide ou expiré');
  }
};
