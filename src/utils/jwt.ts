import jwt from 'jsonwebtoken';
import { config } from '../config/env';

interface JwtPayload {
  userId: string;
  // on peut ajouter d'autres champs si nécessaire
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' }); // token valide 7 jours
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
};
