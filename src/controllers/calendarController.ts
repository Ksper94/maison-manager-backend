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
 * Vérifie que l'utilisateur appartient à un foyer.
 * @param userId
 * @returns foyerId ou null si l'utilisateur n'appartient à aucun foyer
 */
async function verifyUserFoyer(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.foyerId || null;
}

/**
 * Contrôleur : Création d'un événement avec notification
 */
export async function createEventController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    // Vérification de l'appartenance au foyer
    const foyerId = await verifyUserFoyer(userId);
    if (!foyerId) {
      return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour créer un événement.' });
    }

    const { title, description, startDate, endDate } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Les champs title, startDate et endDate sont obligatoires.' });
    }

    // Création de l'événement via le service
    const event = await createCalendarEvent({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      foyerId,
      creatorId: userId,
    });

    // Envoi de notifications push à tous les membres du foyer
    const members = await prisma.user.findMany({
      where: { foyerId },
      select: { pushToken: true }, // Assurez-vous que `pushToken` existe dans votre schéma Prisma
    });

    const pushTokens = members
      .map((member) => member.pushToken)
      .filter((token): token is string => !!token); // Filtre les tokens non valides

    for (const token of pushTokens) {
      await sendPushNotification(token, `Nouvel événement créé : ${title}`);
    }

    return res.status(201).json({
      message: 'Événement créé avec succès.',
      event,
    });
  } catch (error: any) {
    next(error);
  }
}

// Les autres contrôleurs restent inchangés

export async function getEventsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    const foyerId = await verifyUserFoyer(userId);
    if (!foyerId) {
      return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour voir les événements.' });
    }

    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const events = await getCalendarEvents(foyerId, from, to);
    return res.status(200).json(events);
  } catch (error) {
    next(error);
  }
}

export async function getEventByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.eventId;
    const event = await getCalendarEventById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    return res.status(200).json(event);
  } catch (error) {
    next(error);
  }
}

export async function updateEventController(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.eventId;

    const { title, description, startDate, endDate } = req.body;

    const updatedEvent = await updateCalendarEvent({
      eventId,
      title,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return res.status(200).json({
      message: 'Événement mis à jour avec succès.',
      event: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteEventController(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.eventId;

    const deleted = await deleteCalendarEvent(eventId);

    return res.status(200).json({
      message: 'Événement supprimé avec succès.',
      event: deleted,
    });
  } catch (error) {
    next(error);
  }
}
