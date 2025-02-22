"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt"); // <-- remplacer 'verifyToken' par 'verifyAccessToken'
const authMiddleware = (req, res, next) => {
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
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ message: 'Token invalide ou expiré' });
        }
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        console.error('[authMiddleware] Erreur de token :', error);
        return res.status(401).json({ message: 'Échec d’authentification' });
    }
};
exports.authMiddleware = authMiddleware;
