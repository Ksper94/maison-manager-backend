"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasFoyerMiddleware = void 0;
const db_1 = require("../config/db");
const hasFoyerMiddleware = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        // On récupère l’utilisateur en BDD avec son foyer
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: { foyer: true }
        });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Vous devez créer ou rejoindre un foyer avant de continuer' });
        }
        if (!user.acceptedFoyerRuleAt) {
            return res.status(403).json({ message: 'Vous devez accepter la règle du foyer avant de continuer' });
        }
        // Si OK, on passe à la suite
        next();
    }
    catch (error) {
        return res.status(500).json({ message: 'Erreur interne', error });
    }
};
exports.hasFoyerMiddleware = hasFoyerMiddleware;
