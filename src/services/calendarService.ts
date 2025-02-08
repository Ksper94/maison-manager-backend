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
 * Format de planning personnalisé que le frontend envoie
 * @example
 * {
 *   title: 'Mon planning',
 *   recurrence: 'weekly' | 'monthly' | 'monthlyOneOff',
 *   schedule: { monday: { start: '09:00', end: '18:00' }, ... },
 *   foyerId: 'xxx',
 *   creatorId: 'yyy',
 *   month?: 3,
 *   year?: 2025
 * }
 */
interface CreatePlanningInput {
  title: string;
  recurrence: 'weekly' | 'monthly' | 'monthlyOneOff';
  schedule: {
    [dayKey: string]: { start: string; end: string }; // start/end => "HH:MM"
  };
  foyerId: string;
  creatorId?: string;
  month?: number;
  year?: number;
}

/* =================================================== */
/*                 Fonctions de base                   */
/* =================================================== */

export async function createCalendarEvent(data: CreateEventInput) {
  const { title, description, startDate, endDate, recurrence, foyerId, creatorId } = data;

  // Validation basique
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
 * Crée un planning à partir d'un format personnalisé (weekly, monthly ou monthlyOneOff).
 * On décompose chaque jour choisi en un événement distinct.
 */
export async function createPlanningEvent(data: CreatePlanningInput) {
  console.log('[createPlanningEvent] Données reçues :', data);
  const events = [];

  if (data.recurrence === 'monthly' || data.recurrence === 'monthlyOneOff') {
    if (!data.month || !data.year) {
      throw new Error('Pour un planning mensuel, les champs month et year sont requis.');
    }

    for (const dayStr in data.schedule) {
      const day = parseInt(dayStr, 10);
      const { start, end } = data.schedule[dayStr]; // ex: start="09:00", end="18:00"

      // On parse manuellement les heures/minutes
      const [startH, startM] = start.split(':').map((v) => parseInt(v, 10));
      const [endH, endM] = end.split(':').map((v) => parseInt(v, 10));

      // Construction des dates : année/mois/jour + heure/minute
      const startDate = new Date(data.year, data.month - 1, day, startH, startM, 0);
      const endDate = new Date(data.year, data.month - 1, day, endH, endM, 0);

      console.log(
        `[createPlanningEvent] Jour ${day} => start=${startDate.toISOString()}, end=${endDate.toISOString()}`
      );

      if (startDate >= endDate) {
        throw new Error(
          `La date de fin doit être postérieure à la date de début pour le jour ${day}`
        );
      }

      // monthlyOneOff => on enregistre "none" (événement ponctuel)
      const eventRecurrence = data.recurrence === 'monthlyOneOff' ? 'none' : 'monthly';

      const event = await prisma.calendarEvent.create({
        data: {
          title: data.title,
          description: `Planning mensuel pour le jour ${day}`,
          startDate,
          endDate,
          recurrence: eventRecurrence,
          foyerId: data.foyerId,
          creatorId: data.creatorId,
        },
      });
      events.push(event);
    }
  } else if (data.recurrence === 'weekly') {
    const dayOfWeekMapping: { [key: string]: number } = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };

    for (const dayKey in data.schedule) {
      const { start, end } = data.schedule[dayKey];
      const targetDay = dayOfWeekMapping[dayKey.toLowerCase()];
      if (targetDay === undefined) {
        throw new Error(`Jour invalide: ${dayKey}`);
      }

      // On parse manuellement "HH:MM"
      const [startH, startM] = start.split(':').map((v) => parseInt(v, 10));
      const [endH, endM] = end.split(':').map((v) => parseInt(v, 10));

      // On trouve la prochaine occurrence de ce jour
      const baseDate = new Date();
      const currentDay = baseDate.getDay(); // 0 (dim) -> 6 (sam)
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0) daysToAdd += 7;
      if (daysToAdd === 0) {
        // Si on est déjà le bon jour, on vérifie si on doit le "pousser" à la semaine prochaine
        // selon votre logique. Ici, on considère qu'on peut l'ajouter pour aujourd'hui si l'heure n'est pas déjà passée.
      }
      const eventDateBase = new Date(baseDate);
      eventDateBase.setDate(baseDate.getDate() + daysToAdd);

      // Construction de la date
      const startDate = new Date(
        eventDateBase.getFullYear(),
        eventDateBase.getMonth(),
        eventDateBase.getDate(),
        startH,
        startM,
        0
      );
      const endDate = new Date(
        eventDateBase.getFullYear(),
        eventDateBase.getMonth(),
        eventDateBase.getDate(),
        endH,
        endM,
        0
      );

      if (startDate >= endDate) {
        throw new Error(`La date de fin doit être postérieure à la date de début pour ${dayKey}`);
      }

      const event = await prisma.calendarEvent.create({
        data: {
          title: data.title,
          description: `Planning hebdomadaire pour ${dayKey}`,
          startDate,
          endDate,
          recurrence: 'weekly',
          foyerId: data.foyerId,
          creatorId: data.creatorId,
        },
      });
      events.push(event);
    }
  } else {
    throw new Error('Type de planning non supporté (must be weekly, monthly, or monthlyOneOff).');
  }

  console.log('[createPlanningEvent] Tous les événements créés :', events);
  return events;
}

/**
 * Récupération de tous les events d'un foyer
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

  const events = await prisma.calendarEvent.findMany({
    where: whereClause,
    orderBy: { startDate: 'asc' },
    take: 1000,
  });

  return events.map((event) => {
    if (event.recurrence === 'none') return event;
    // Sinon, générer occurrences récurrentes => ex: daily, weekly, monthly
    return generateRecurringEvents(event, from, to);
  }).flat();
}

export async function getCalendarEventById(eventId: string) {
  return prisma.calendarEvent.findUnique({ where: { id: eventId } });
}

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

export async function deleteCalendarEvent(eventId: string) {
  return prisma.calendarEvent.delete({ where: { id: eventId } });
}

/**
 * Génère les occurrences récurrentes (daily, weekly, monthly, yearly).
 * On peut affiner la logique si besoin (ex: stopper après X occurrences).
 */
function generateRecurringEvents(event: any, from?: Date, to?: Date) {
  const recurringEvents = [];
  let currentDate = new Date(event.startDate);
  const MAX_OCC = 500;
  let count = 0;

  while ((!to || currentDate <= to) && count < MAX_OCC) {
    if (!from || currentDate >= from) {
      // On clone l'event en modifiant startDate/endDate
      const offset = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
      const newStart = new Date(currentDate);
      const newEnd = new Date(currentDate.getTime() + offset);

      recurringEvents.push({
        ...event,
        startDate: newStart,
        endDate: newEnd,
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
        // 'none' ou non supporté
        return recurringEvents;
    }
  }

  return recurringEvents;
}
