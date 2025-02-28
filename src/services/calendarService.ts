import { prisma } from '../config/db';

/* ========================================================================== */
/*                              INTERFACES                                    */
/* ========================================================================== */

interface CreateEventInput {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  foyerId: string;
  creatorId?: string;
  /**
   * Ajout d’un champ optionnel pour indiquer
   * qui a complété cet événement (ex: “courses terminées”).
   */
  completedById?: string;
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

/* ========================================================================== */
/*                      CREATION D'ÉVÉNEMENTS CLASSIQUES                      */
/* ========================================================================== */

/**
 * Crée un nouvel événement (non-récurrent ou récurrent).
 */
export async function createCalendarEvent(data: CreateEventInput) {
  const {
    title,
    description,
    startDate,
    endDate,
    recurrence,
    foyerId,
    creatorId,
    completedById, // <-- On récupère le champ optionnel
  } = data;

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

  // On crée l'événement en stockant completedById si fourni
  return prisma.calendarEvent.create({
    data: {
      title,
      description,
      startDate,
      endDate,
      recurrence,
      foyerId,
      creatorId,
      completedById, // <-- Stocké dans la DB s’il est présent
    },
  });
}

/* ========================================================================== */
/*                           PLANNING (CRÉATION EN MASSE)                     */
/* ========================================================================== */

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
      // Si daysToAdd === 0, on peut décider de l'ajouter pour la semaine suivante, etc.

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
    throw new Error(
      'Type de planning non supporté (must be weekly, monthly, or monthlyOneOff).'
    );
  }

  console.log('[createPlanningEvent] Tous les événements créés :', events);
  return events;
}

/* ========================================================================== */
/*                      RÉCUPÉRATION / SUPPRESSION / MISE À JOUR              */
/* ========================================================================== */

/**
 * Récupération de tous les events d'un foyer,
 * en incluant la relation completedBy (pour avoir id, name, avatar).
 * On déplie ensuite les occurrences récurrentes si recurrence != 'none'.
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

  // Inclure la relation completedBy
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

  // On déplie les événements récurrents
  const expandedEvents = events
    .map((event) => {
      // Si pas de récurrence, on renvoie directement (enrichi)
      if (event.recurrence === 'none') {
        return {
          ...event,
          // On rajoute completedByName / completedByAvatar pour le front
          completedByName: event.completedBy?.name || null,
          completedByAvatar: event.completedBy?.avatar || null,
        };
      }
      // Sinon, on génère les occurrences
      return generateRecurringEventsWithUser(event, from, to);
    })
    .flat();

  return expandedEvents;
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

/* ========================================================================== */
/*                      GÉNÉRATION DES OCCURRENCES RÉCURRENTES                */
/* ========================================================================== */

/**
 * Génére les occurrences pour un event récurrent
 * en recopiant les infos completedByName / completedByAvatar
 */
function generateRecurringEventsWithUser(event: any, from?: Date, to?: Date) {
  const recurringEvents = [];
  let currentDate = new Date(event.startDate);
  const MAX_OCC = 500;
  let count = 0;

  // On calcule la durée initiale
  const offset = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();

  while ((!to || currentDate <= to) && count < MAX_OCC) {
    if (!from || currentDate >= from) {
      // On clone l'event pour cette occurrence
      const newStart = new Date(currentDate);
      const newEnd = new Date(currentDate.getTime() + offset);

      recurringEvents.push({
        ...event,
        startDate: newStart,
        endDate: newEnd,
        // On recopie completedByName / completedByAvatar pour chaque occurrence
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
        // 'none' ou non supporté
        return recurringEvents;
    }
  }

  return recurringEvents;
}
