import { prisma } from '../config/db';

interface CreateEventInput {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  foyerId: string;
  creatorId?: string;
  // completedById?: string; // Optionnel si on veut le renseigner au moment de la création
}

interface UpdateEventInput {
  eventId: string;
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

/**
 * Crée un nouvel événement (non-récurrent ou récurrent).
 */
export async function createCalendarEvent(data: CreateEventInput) {
  const { title, description, startDate, endDate, recurrence, foyerId, creatorId } = data;

  if (recurrence !== 'none' && startDate > endDate) {
    throw new Error(
      'La date de fin doit être postérieure à la date de début pour les événements récurrents.'
    );
  } else if (recurrence === 'none' && startDate >= endDate) {
    throw new Error(
      'La date de fin doit être strictement postérieure à la date de début pour les événements non récurrents.'
    );
  }

  return prisma.calendarEvent.create({
    data: {
      title,
      description,
      startDate,
      endDate,
      recurrence,
      foyerId,
      creatorId,
    },
  });
}

/**
 * Récupère les événements d'un foyer, avec éventuellement des dates "from" et "to".
 * Inclus le champ completedBy (id, name, avatar).
 * S'il y a récurrence, on génère et "déplie" les occurrences.
 */
export async function getCalendarEvents(foyerId: string, from?: Date, to?: Date) {
  const whereClause: any = { foyerId };

  if (from && to) {
    whereClause.AND = [
      {
        OR: [
          { startDate: { gte: from, lte: to } },
          { endDate: { gte: from, lte: to } },
          { startDate: { lte: from }, endDate: { gte: to } },
        ],
      },
    ];
  }

  // 1. On inclut la relation completedBy pour récupérer name, avatar, etc.
  const events = await prisma.calendarEvent.findMany({
    where: whereClause,
    include: {
      completedBy: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { startDate: 'asc' },
    take: 1000,
  });

  // 2. Pour chaque event, si recurrence != 'none', on génère les occurrences
  //    et on leur assigne également completedByName / completedByAvatar.
  const expandedEvents = events
    .map((event) => {
      if (event.recurrence === 'none') {
        // On renvoie l'event d'origine en enrichissant avec completedByName/avatar
        return {
          ...event,
          completedByName: event.completedBy?.name || null,
          completedByAvatar: event.completedBy?.avatar || null,
        };
      }
      // Sinon, on génère les occurrences
      return generateRecurringEvents(event, from, to);
    })
    .flat();

  return expandedEvents;
}

/**
 * Génére les occurrences pour les événements récurrents (daily, weekly, monthly, yearly).
 * On "clone" l'objet event et on ajoute completedByName / completedByAvatar si existants.
 */
function generateRecurringEvents(event: any, from?: Date, to?: Date) {
  const recurringEvents = [];
  let currentDate = new Date(event.startDate);
  const maxOccurrences = 500;
  let count = 0;

  // Diff entre début et fin de l'événement initial (durée)
  const duration = new Date(event.endDate).getTime() - currentDate.getTime();

  while ((!to || currentDate <= to) && count < maxOccurrences) {
    // On regarde si on est passé au-delà de la date "from", si definie
    if (!from || currentDate >= from) {
      // On clone l'event pour cette occurrence
      const newStart = new Date(currentDate);
      const newEnd = new Date(currentDate.getTime() + duration);

      recurringEvents.push({
        ...event,
        startDate: newStart,
        endDate: newEnd,
        // On injecte completedByName / completedByAvatar
        completedByName: event.completedBy?.name || null,
        completedByAvatar: event.completedBy?.avatar || null,
      });
      count++;
    }

    switch (event.recurrence) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        // Pas de récurrence ou non gérée
        return recurringEvents;
    }
  }

  return recurringEvents;
}

/**
 * Récupère un événement par ID
 */
export async function getCalendarEventById(eventId: string) {
  return prisma.calendarEvent.findUnique({ where: { id: eventId } });
}

/**
 * Met à jour un événement existant
 */
export async function updateCalendarEvent(data: UpdateEventInput) {
  const { eventId, title, description, startDate, endDate, recurrence } = data;
  if (startDate && endDate && startDate >= endDate) {
    throw new Error('La date de fin doit être postérieure à la date de début.');
  }
  return prisma.calendarEvent.update({
    where: { id: eventId },
    data: { title, description, startDate, endDate, recurrence },
  });
}

/**
 * Supprime un événement
 */
export async function deleteCalendarEvent(eventId: string) {
  return prisma.calendarEvent.delete({ where: { id: eventId } });
}

/* ==========================================================================
   => createPlanningEvent : inchangé, sauf si tu veux aussi y inclure completedBy
      lors de la création, mais d'après ton use case, ça n'a pas l'air nécessaire.
   ========================================================================== */
