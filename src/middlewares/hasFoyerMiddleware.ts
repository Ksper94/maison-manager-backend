// src/middlewares/hasFoyerMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

interface CustomRequest extends Request {
  userId?: string;
}

export const hasFoyerMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // 1) Vérifier si l'utilisateur existe et récupérer acceptedFoyerRuleAt
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        acceptedFoyerRuleAt: true,
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Utilisateur introuvable ou non authentifié' });
    }

    // 2) Vérifier si l'utilisateur appartient à au moins un foyer via la table pivot
    const pivotRecord = await prisma.userFoyer.findFirst({
      where: { userId },
    });

    if (!pivotRecord) {
      return res.status(403).json({
        message: 'Vous devez créer ou rejoindre un foyer avant de continuer',
      });
    }

    // 3) Vérifier si l'utilisateur a accepté la règle du foyer
    if (!user.acceptedFoyerRuleAt) {
      return res.status(403).json({
        message: 'Vous devez accepter la règle du foyer avant de continuer',
      });
    }

    // OK, l'utilisateur est dans un foyer ET a accepté la règle
    next();
  } catch (error) {
    console.error('[hasFoyerMiddleware] Erreur :', error);
    return res.status(500).json({ message: 'Erreur interne', error });
  }
};
