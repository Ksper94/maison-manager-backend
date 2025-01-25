import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export async function getLeaderboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    // On récupère l'utilisateur pour connaître son foyer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { foyerId: true }, // Sélectionne uniquement les données nécessaires
    });
    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour voir le classement.' });
    }

    // Récupérer les membres du foyer, triés par points décroissants
    const members = await prisma.user.findMany({
      where: { foyerId: user.foyerId },
      orderBy: { points: 'desc' },
      select: {
        id: true,
        name: true,
        points: true,
      },
    });

    // Réponse JSON avec le classement
    return res.status(200).json({
      message: 'Classement récupéré avec succès',
      leaderboard: members,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du classement :', error);
    next(error);
  }
}
