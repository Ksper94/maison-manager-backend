import { Request, Response, NextFunction } from 'express';
import {
  createCalendarEvent,
  getCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../services/calendarService';
import { prisma } from '../config/db';
import { sendPushNotification } from '../utils/notifications';

/**
 * Interface pour ajouter userId au Request
 */
interface CustomRequest extends Request {
  userId?: string;
}

/**
 * Vérifie si le user est associé à un foyer (many-to-many)
 * et renvoie le *premier* foyerId trouvé.
 * Si le user n'est dans aucun foyer, renvoie null.
 */
async function verifyUserFoyer(userId: string): Promise<string | null> {
  const userFoyerRecord = await prisma.userFoyer.findFirst({
    where: { userId },
  });
  return userFoyerRecord?.foyerId || null;
}

/**
 * Crée un nouvel événement dans le foyer du user (le premier foyer trouvé).
 */
export async function createEventController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // On récupère le foyerId via la pivot table UserFoyer
    const foyerId = await verifyUserFoyer(userId);
    if (!foyerId) {
      return res.status(403).json({
        message: 'Vous devez appartenir à un foyer pour créer un événement.',
      });
    }

    const { title, description, startDate, endDate, recurrence } = req.body;

    if (!title || !startDate || !endDate || !recurrence) {
      return res.status(400).json({
        message:
          'Les champs title, startDate, endDate et recurrence sont obligatoires.',
      });
    }

    // Création de l'événement via ton service
    const event = await createCalendarEvent({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      recurrence,
      foyerId,
      creatorId: userId,
    });

    // Récupération de tous les userFoyer liés à ce foyer
    // pour obtenir les tokens des membres
    const userFoyerRecords = await prisma.userFoyer.findMany({
      where: { foyerId },
      include: {
        user: {
          select: {
            pushToken: true,
          },
        },
      },
    });

    // Extraction des pushTokens
    const pushTokens = userFoyerRecords
      .map((uf) => uf.user?.pushToken)
      .filter((token): token is string => Boolean(token));

    // Envoi des notifications
    for (const token of pushTokens) {
      await sendPushNotification(token, `Nouvel événement créé : ${title}`);
    }

    return res.status(201).json({ message: 'Événement créé avec succès.', event });
  } catch (error) {
    console.error('[createEventController] Erreur :', error);
    next(error);
  }
}

/**
 * Récupère tous les événements du foyer du user (le premier foyer trouvé).
 */
export async function getEventsController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const foyerId = await verifyUserFoyer(userId);
    if (!foyerId) {
      return res.status(403).json({
        message: 'Vous devez appartenir à un foyer pour voir les événements.',
      });
    }

    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    // Récupération des events via ton service
    const events = await getCalendarEvents(foyerId, from, to);
    return res.status(200).json(events);
  } catch (error) {
    console.error('[getEventsController] Erreur :', error);
    next(error);
  }
}

/**
 * Récupère un événement par son ID (pas besoin de foyerId ici).
 */
export async function getEventByIdController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = req.params.eventId;
    const event = await getCalendarEventById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    return res.status(200).json(event);
  } catch (error) {
    console.error('[getEventByIdController] Erreur :', error);
    next(error);
  }
}

/**
 * Met à jour un événement.
 */
export async function updateEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = req.params.eventId;
    const { title, description, startDate, endDate, recurrence } = req.body;

    const updatedEvent = await updateCalendarEvent({
      eventId,
      title,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      recurrence,
    });

    return res
      .status(200)
      .json({ message: 'Événement mis à jour avec succès.', event: updatedEvent });
  } catch (error) {
    console.error('[updateEventController] Erreur :', error);
    next(error);
  }
}

/**
 * Supprime un événement.
 */
export async function deleteEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = req.params.eventId;

    const deletedEvent = await deleteCalendarEvent(eventId);
    return res
      .status(200)
      .json({ message: 'Événement supprimé avec succès.', event: deletedEvent });
  } catch (error) {
    console.error('[deleteEventController] Erreur :', error);
    next(error);
  }
}
