"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.generateRefreshToken = exports.verifyAccessToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * Génère un Access Token valide pendant 15 minutes
 * @param payload - Les données à inclure dans le token (ex. userId)
 * @returns Le token JWT signé
 */
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.config.JWT_SECRET, { expiresIn: '15m' });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Vérifie la validité d'un Access Token
 * @param token - Le token à vérifier
 * @returns Le payload décodé
 * @throws Error si le token est invalide ou expiré
 */
const verifyAccessToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
        if (!decoded.userId) {
            throw new Error('Token invalide : userId manquant');
        }
        return decoded;
    }
    catch (error) {
        console.error('[verifyAccessToken] Erreur :', error);
        throw new Error('Access token invalide ou expiré');
    }
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Génère un Refresh Token valide pendant 7 jours
 * @param payload - Les données à inclure dans le token (ex. userId)
 * @returns Le token JWT signé
 */
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Vérifie la validité d'un Refresh Token
 * @param token - Le token à vérifier
 * @returns Le payload décodé
 * @throws Error si le token est invalide ou expiré
 */
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.JWT_REFRESH_SECRET);
        if (!decoded.userId) {
            throw new Error('Refresh token invalide : userId manquant');
        }
        return decoded;
    }
    catch (error) {
        console.error('[verifyRefreshToken] Erreur :', error);
        throw new Error('Refresh token invalide ou expiré');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
