import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';

interface CustomJwtPayload extends JwtPayload {
  userId: string; // Identifiant unique de l'utilisateur
}

/**
 * Génère un Access Token valide pendant 15 minutes
 * @param payload - Les données à inclure dans le token (ex. userId)
 * @returns Le token JWT signé
 */
export const generateAccessToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Vérifie la validité d'un Access Token
 * @param token - Le token à vérifier
 * @returns Le payload décodé
 * @throws Error si le token est invalide ou expiré
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
 * Génère un Refresh Token valide pendant 7 jours
 * @param payload - Les données à inclure dans le token (ex. userId)
 * @returns Le token JWT signé
 */
export const generateRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Vérifie la validité d'un Refresh Token
 * @param token - Le token à vérifier
 * @returns Le payload décodé
 * @throws Error si le token est invalide ou expiré
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
