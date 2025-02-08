import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendPushNotification } from '../utils/notifications';
import { createPlanningEvent } from '../services/calendarService';

interface CustomRequest extends Request {
  userId?: string;
}

async function verifyUserFoyer(userId: string): Promise<string | null> {
  const userFoyerRecord = await prisma.userFoyer.findFirst({
    where: { userId },
  });
  return userFoyerRecord?.foyerId || null;
}

export async function createPlanningController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const foyerId = await verifyUserFoyer(req.userId);
    if (!foyerId) {
      return res.status(403).json({
        message: 'Vous devez appartenir à un foyer pour créer un planning.',
      });
    }

    const planningData = req.body;
    planningData.foyerId = foyerId;
    planningData.creatorId = req.userId;

    const events = await createPlanningEvent(planningData);

    // (Optionnel) Notifications
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
