"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
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
        const decoded = (0, jwt_1.verifyToken)(token);
        req.userId = decoded.userId; // On assigne l'userId pour l'utiliser ensuite
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};
exports.authMiddleware = authMiddleware;
