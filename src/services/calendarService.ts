import { prisma } from '../config/db';

interface CreateEventInput {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  foyerId: string;
  creatorId?: string;
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
 * Créer un nouvel événement de calendrier.
 * Gère les validations de base sur les dates et la récurrence.
 */
export async function createCalendarEvent(data: CreateEventInput) {
  const { title, description, startDate, endDate, recurrence, foyerId, creatorId } = data;

  // Logique spécifique éventuelle pour monthly/weekly (optionnel).
  // On suppose que le frontend envoie déjà les dates correctes.

  // Validation des dates
  if (recurrence !== 'none' && startDate > endDate) {
    throw new Error(
      'La date de fin doit être postérieure à la date de début pour les événements récurrents.'
    );
  } else if (recurrence === 'none' && startDate >= endDate) {
    throw new Error(
      'La date de fin doit être postérieure ou égale à la date de début pour les événements non récurrents.'
    );
  }

  // Création en base
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
 * Récupérer la liste des événements d'un foyer,
 * avec un éventuel intervalle de date (from / to).
 * Gère la récurrence en générant des événements "dépliés" si besoin.
 */
export async function getCalendarEvents(foyerId: string, from?: Date, to?: Date) {
  // Construction dynamique du where
  const whereClause: any = { foyerId };

  if (from && to) {
    // On cherche tous les events dont la période [startDate..endDate] intersecte [from..to].
    whereClause.AND = [
      {
        OR: [
          // L'événement commence pendant l'intervalle
          {
            startDate: { gte: from, lte: to },
          },
          // L'événement finit pendant l'intervalle
          {
            endDate: { gte: from, lte: to },
          },
          // L'événement couvre l'intégralité de l'intervalle
          {
            startDate: { lte: from },
            endDate: { gte: to },
          },
        ],
      },
    ];
  }

  // Récupération des events
  const events = await prisma.calendarEvent.findMany({
    where: whereClause,
    orderBy: { startDate: 'asc' },
    take: 1000, // Limite à 1000 événements
  });
  

  // Génération des occurrences récurrentes, si besoin
  return events
    .map((event) => {
      if (event.recurrence === 'none') {
        return event;
      }
      return generateRecurringEvents(event, from, to);
    })
    .flat();
}

/**
 * Récupérer un événement par son ID.
 */
export async function getCalendarEventById(eventId: string) {
  return prisma.calendarEvent.findUnique({
    where: { id: eventId },
  });
}

/**
 * Mettre à jour un événement de calendrier.
 * Gère une validation de base sur la cohérence des dates.
 */
export async function updateCalendarEvent(data: UpdateEventInput) {
  const { eventId, title, description, startDate, endDate, recurrence } = data;

  if (startDate && endDate && startDate >= endDate) {
    throw new Error('La date de fin doit être postérieure à la date de début.');
  }

  return prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      title,
      description,
      startDate,
      endDate,
      recurrence,
    },
  });
}

/**
 * Supprime un événement de calendrier par ID.
 */
export async function deleteCalendarEvent(eventId: string) {
  return prisma.calendarEvent.delete({
    where: { id: eventId },
  });
}

/**
 * Génère les occurrences récurrentes d'un événement (daily, weekly, monthly, yearly).
 * Renvoie un tableau "déplié" d'événements dupliqués dans l'intervalle [from..to].
 */
function generateRecurringEvents(event: any, from?: Date, to?: Date) {
  const recurringEvents = [];
  let currentDate = new Date(event.startDate);

  const MAX_OCCURRENCES = 500; // Limite à 500 occurrences pour éviter OOM
  let occurrencesCount = 0;

  while ((!to || currentDate <= to) && occurrencesCount < MAX_OCCURRENCES) {
    if (!from || currentDate >= from) {
      recurringEvents.push({
        ...event,
        startDate: new Date(currentDate),
        endDate: new Date(
          currentDate.getTime() + 
          (new Date(event.endDate).getTime() - new Date(event.startDate).getTime())
        ),
      });
      occurrencesCount++;
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
        return recurringEvents;
    }
  }

  return recurringEvents;
}
