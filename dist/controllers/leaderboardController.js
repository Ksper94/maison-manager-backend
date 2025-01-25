"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboardController = getLeaderboardController;
const db_1 = require("../config/db");
async function getLeaderboardController(req, res, next) {
    try {
        const userId = req.userId;
        // On récupère l'utilisateur pour connaître son foyer
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour voir le classement.' });
        }
        // On récupère tous les users de ce foyer, triés par points desc
        const members = await db_1.prisma.user.findMany({
            where: { foyerId: user.foyerId },
            orderBy: { points: 'desc' },
            select: {
                id: true,
                name: true,
                points: true
            }
        });
        return res.status(200).json(members);
    }
    catch (error) {
        next(error);
    }
}
