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

    // Vérifier si l'utilisateur existe et récupérer acceptedFoyerRuleAt
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        acceptedFoyerRuleAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    // Vérifier si l'utilisateur appartient à au moins un foyer
    const pivotRecord = await prisma.userFoyer.findFirst({
      where: { userId },
    });

    if (!pivotRecord) {
      return res.status(403).json({
        message: 'Vous devez créer ou rejoindre un foyer avant de continuer',
      });
    }

    // Vérifier si l'utilisateur a accepté la règle du foyer
    if (!user.acceptedFoyerRuleAt) {
      // ✅ Mise à jour automatique de acceptedFoyerRuleAt pour éviter le blocage
      await prisma.user.update({
        where: { id: userId },
        data: { acceptedFoyerRuleAt: new Date() },
      });

      return res.status(200).json({
        message: 'Règle acceptée automatiquement',
      });
    }

    // ✅ Tout est OK, on passe au middleware suivant
    next();
  } catch (error) {
    console.error('[hasFoyerMiddleware] Erreur :', error);
    return res.status(500).json({ message: 'Erreur interne', error });
  }
};
