// calendarEvents.ts
import { prisma } from '../config/db';

/* =========================== */
/*    Interfaces d'entrée     */
/* =========================== */

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
 * Pour la création d'un planning via un format personnalisé.
 * Pour un planning mensuel, le front-end doit envoyer :
 *  - title, recurrence ("monthly", "weekly" ou "monthlyOneOff"),
 *  - schedule : un objet dont chaque clé représente un jour sélectionné 
 *    (pour "monthly", une chaîne représentant le numéro du jour; pour "weekly", un nom de jour),
 *  - pour monthly : month (1-12) et year (ex. 2025),
 *  - foyerId et éventuellement creatorId.
 */
interface CreatePlanningInput {
  title: string;
  recurrence: 'weekly' | 'monthly' | 'monthlyOneOff';
  schedule: { [dayKey: string]: { start: string; end: string } };
  foyerId: string;
  creatorId?: string;
  month?: number; // requis pour un planning mensuel
  year?: number;  // requis pour un planning mensuel
}

/* =========================== */
/*    Fonctions de base       */
/* =========================== */

/**
 * Créer un événement standard.
 */
export async function createCalendarEvent(data: CreateEventInput) {
  const { title, description, startDate, endDate, recurrence, foyerId, creatorId } = data;

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
 * Créer un planning à partir d'un format personnalisé.
 * Cette fonction décompose le planning en plusieurs événements individuels.
 */
export async function createPlanningEvent(data: CreatePlanningInput) {
  console.log('[createPlanningEvent] Données reçues :', data);
  const events = [];

  if (data.recurrence === 'monthly' || data.recurrence === 'monthlyOneOff') {
    if (!data.month || !data.year) {
      throw new Error('Pour un planning mensuel, les champs month et year sont requis.');
    }
    // Pour chaque jour sélectionné dans le planning mensuel
    for (const dayStr in data.schedule) {
      const day = parseInt(dayStr, 10);
      const { start, end } = data.schedule[dayStr];
      console.log(`[createPlanningEvent] Traitement du jour ${day} avec start: ${start} et end: ${end}`);

      // Extraction des horaires
      const startDateOriginal = new Date(start);
      const endDateOriginal = new Date(end);

      // Construction des dates en fonction de l'année et du mois choisis
      const startDate = new Date(
        data.year,
        data.month - 1,
        day,
        startDateOriginal.getHours(),
        startDateOriginal.getMinutes(),
        startDateOriginal.getSeconds()
      );
      const endDate = new Date(
        data.year,
        data.month - 1,
        day,
        endDateOriginal.getHours(),
        endDateOriginal.getMinutes(),
        endDateOriginal.getSeconds()
      );

      console.log(`[createPlanningEvent] Dates calculées pour le jour ${day}:`, startDate, endDate);

      if (startDate >= endDate) {
        throw new Error(`La date de fin doit être postérieure à la date de début pour le jour ${day}`);
      }

      // Pour "monthlyOneOff", on stocke la récurrence comme "none" afin d'avoir des événements ponctuels.
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
      console.log(`[createPlanningEvent] Événement créé pour le jour ${day}:`, event);
      events.push(event);
    }
  } else if (data.recurrence === 'weekly') {
    // Mapping pour convertir les noms de jours en valeur numérique
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
      // Calculer la prochaine occurrence de ce jour à partir d'aujourd'hui
      const baseDate = new Date();
      const currentDay = baseDate.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      const eventDateBase = new Date(baseDate);
      eventDateBase.setDate(baseDate.getDate() + daysToAdd);

      const startDateOriginal = new Date(start);
      const endDateOriginal = new Date(end);
      const startDate = new Date(
        eventDateBase.getFullYear(),
        eventDateBase.getMonth(),
        eventDateBase.getDate(),
        startDateOriginal.getHours(),
        startDateOriginal.getMinutes(),
        startDateOriginal.getSeconds()
      );
      const endDate = new Date(
        eventDateBase.getFullYear(),
        eventDateBase.getMonth(),
        eventDateBase.getDate(),
        endDateOriginal.getHours(),
        endDateOriginal.getMinutes(),
        endDateOriginal.getSeconds()
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
          recurrence: data.recurrence, // "weekly"
          foyerId: data.foyerId,
          creatorId: data.creatorId,
        },
      });
      console.log(`[createPlanningEvent] Événement créé pour ${dayKey}:`, event);
      events.push(event);
    }
  } else {
    throw new Error('Type de planning non supporté.');
  }

  console.log('[createPlanningEvent] Tous les événements créés :', events);
  return events;
}

/* =========================== */
/*   Autres Fonctions CRUD    */
/* =========================== */

/**
 * Récupère la liste des événements d'un foyer,
 * avec un éventuel intervalle de date (from/to).
 * Génère également les occurrences récurrentes si nécessaire.
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

  return events
    .map((event) => {
      if (event.recurrence === 'none') return event;
      return generateRecurringEvents(event, from, to);
    })
    .flat();
}

/**
 * Récupère un événement par son ID.
 */
export async function getCalendarEventById(eventId: string) {
  return prisma.calendarEvent.findUnique({
    where: { id: eventId },
  });
}

/**
 * Met à jour un événement de calendrier.
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
 * Supprime un événement de calendrier par son ID.
 */
export async function deleteCalendarEvent(eventId: string) {
  return prisma.calendarEvent.delete({
    where: { id: eventId },
  });
}

/* =========================== */
/* Génération d'occurrences    */
/* =========================== */

/**
 * Génère les occurrences récurrentes d'un événement (daily, weekly, monthly, yearly).
 * Renvoie un tableau "déplié" d'événements.
 */
function generateRecurringEvents(event: any, from?: Date, to?: Date) {
  const recurringEvents = [];
  let currentDate = new Date(event.startDate);
  const MAX_OCCURRENCES = 500;
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
