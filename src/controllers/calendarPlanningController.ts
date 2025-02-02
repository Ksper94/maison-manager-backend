import { Request, Response, NextFunction } from 'express';
import { createPlanningEvent } from '../services/calendarService';
import { prisma } from '../config/db';
import { sendPushNotification } from '../utils/notifications';

interface CustomRequest extends Request {
  userId?: string;
}

/**
 * Vérifie si l'utilisateur est associé à un foyer (via la table de pivot UserFoyer)
 * et renvoie le premier foyerId trouvé.
 * Retourne null si l'utilisateur n'appartient à aucun foyer.
 */
async function verifyUserFoyer(userId: string): Promise<string | null> {
  const userFoyerRecord = await prisma.userFoyer.findFirst({
    where: { userId },
  });
  return userFoyerRecord?.foyerId || null;
}

/**
 * Contrôleur pour la création d'un planning.
 * Le front-end doit envoyer dans le corps de la requête un objet incluant :
 *  - title
 *  - recurrence ("monthly" ou "weekly")
 *  - schedule : un objet dont les clés représentent soit les noms de jours (weekly),
 *    soit les numéros de jour (monthly) et les valeurs sont { start, end } en ISO.
 *  - Pour un planning mensuel, les champs month (1-12) et year (ex. 2025) sont requis.
 *  - foyerId et creatorId seront injectés à partir du contexte de l'utilisateur.
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

    // Vérification du foyer de l'utilisateur
    const foyerId = await verifyUserFoyer(userId);
    if (!foyerId) {
      return res.status(403).json({
        message: 'Vous devez appartenir à un foyer pour créer un planning.',
      });
    }

    // Récupérer les données du planning depuis le corps de la requête
    const planningData = req.body;
    planningData.foyerId = foyerId;
    planningData.creatorId = userId;

    // Appel de la fonction de service pour créer le planning
    const events = await createPlanningEvent(planningData);

    // (Optionnel) Envoi de notifications aux membres du foyer
    const userFoyerRecords = await prisma.userFoyer.findMany({
      where: { foyerId },
      include: {
        user: {
          select: { pushToken: true },
        },
      },
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
