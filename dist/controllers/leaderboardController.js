"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboardController = getLeaderboardController;
const db_1 = require("../config/db");
/**
 * Récupère le classement (leaderboard) d'un foyer,
 * en se basant sur le *premier* foyer trouvé de l'utilisateur.
 */
async function getLeaderboardController(req, res, next) {
    try {
        const userId = req.userId; // ou autre méthode pour récupérer userId
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        // 1) Trouver le pivot userFoyer pour connaître le foyerId de l'utilisateur
        const userFoyerPivot = await db_1.prisma.userFoyer.findFirst({
            where: { userId },
        });
        if (!userFoyerPivot) {
            return res
                .status(403)
                .json({ message: 'Vous devez appartenir à un foyer pour voir le classement.' });
        }
        const foyerId = userFoyerPivot.foyerId;
        // 2) Récupérer tous les userFoyer records pour ce foyer
        //    et trier par user.points en ordre descendant
        const userFoyerRecords = await db_1.prisma.userFoyer.findMany({
            where: { foyerId },
            orderBy: {
                user: {
                    points: 'desc', // Tri par points du user
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        points: true,
                    },
                },
            },
        });
        // 3) Extraire la liste des users triés par points
        const leaderboard = userFoyerRecords.map((uf) => uf.user);
        return res.status(200).json({
            message: 'Classement récupéré avec succès',
            leaderboard,
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération du classement :', error);
        next(error);
    }
}
