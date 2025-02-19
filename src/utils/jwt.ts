import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';

interface CustomJwtPayload extends JwtPayload {
  userId: string; // Ajout d'un champ personnalisé pour ton application
}

/**
 * Générer un Access Token (ex: 15 minutes)
 */
export const generateAccessToken = (payload: { userId: string }): string => {
  // Tu peux changer '15m' en '1h' ou autre selon tes besoins
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Vérifier l'Access Token
 */
export const verifyAccessToken = (token: string): CustomJwtPayload => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as CustomJwtPayload;
    if (!decoded.userId) {
      throw new Error('Token invalide : userId manquant');
    }
    return decoded;
  } catch (error) {
    console.error('[verifyAccessToken] Erreur :', error);
    throw new Error('Access token invalide ou expiré');
  }
};

/**
 * Générer un Refresh Token (ex: 7 jours)
 */
export const generateRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Vérifier le Refresh Token
 */
export const verifyRefreshToken = (token: string): CustomJwtPayload => {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as CustomJwtPayload;
    if (!decoded.userId) {
      throw new Error('Refresh token invalide : userId manquant');
    }
    return decoded;
  } catch (error) {
    console.error('[verifyRefreshToken] Erreur :', error);
    throw new Error('Refresh token invalide ou expiré');
  }
};
