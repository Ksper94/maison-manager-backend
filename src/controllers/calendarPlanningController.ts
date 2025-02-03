// createPlanningController.ts
import { Request, Response, NextFunction } from 'express';
import { createPlanningEvent } from '../services/calendarService';
import { prisma } from '../config/db';
import { sendPushNotification } from '../utils/notifications';

interface CustomRequest extends Request {
  userId?: string;
}

// Vérifie si l'utilisateur est associé à un foyer et renvoie le premier foyerId trouvé.
async function verifyUserFoyer(userId: string): Promise<string | null> {
  const userFoyerRecord = await prisma.userFoyer.findFirst({
    where: { userId },
  });
  return userFoyerRecord?.foyerId || null;
}

/**
 * Contrôleur pour la création d'un planning.
 * Le front-end doit envoyer dans le body un objet comprenant :
 * - title, recurrence ("monthly", "weekly", ou "monthlyOneOff"),
 * - schedule (un objet avec pour chaque jour les horaires start et end),
 * - pour un planning mensuel : month (1-12) et year (ex. 2025).
 * Le foyerId et le creatorId seront ajoutés à partir de l'utilisateur.
 */
export async function createPlanningController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // Vérifier que l'utilisateur appartient à un foyer
    const foyerId = await verifyUserFoyer(userId);
    if (!foyerId) {
      return res.status(403).json({
        message: 'Vous devez appartenir à un foyer pour créer un planning.',
      });
    }

    const planningData = req.body;
    planningData.foyerId = foyerId;
    planningData.creatorId = userId;

    const events = await createPlanningEvent(planningData);

    // (Optionnel) Envoyer des notifications aux membres du foyer
    const userFoyerRecords = await prisma.userFoyer.findMany({
      where: { foyerId },
      include: { user: { select: { pushToken: true } } },
    });
    const pushTokens = userFoyerRecords
      .map((uf) => uf.user?.pushToken)
      .filter((token): token is string => Boolean(token));
    for (const token of pushTokens) {
      await sendPushNotification(token, `Nouveau planning créé : ${planningData.title}`);
    }

    return res.status(201).json({ message: 'Planning créé avec succès.', events });
  } catch (error) {
    console.error('[createPlanningController] Erreur :', error);
    next(error);
  }
}
