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

export async function createCalendarEvent(data: CreateEventInput) {
  const { title, description, startDate, endDate, recurrence, foyerId, creatorId } = data;

  // Pour les événements qui ne sont pas des rendez-vous, on permet que startDate et endDate soient égaux
  if (recurrence !== 'none' && startDate > endDate) {
    throw new Error('La date de fin doit être postérieure à la date de début.');
  } else if (recurrence === 'none' && startDate >= endDate) {
    throw new Error('La date de fin doit être postérieure ou égale à la date de début pour les événements non récurrents.');
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

export async function getCalendarEvents(foyerId: string, from?: Date, to?: Date) {
  const whereClause: any = { foyerId };

  if (from && to) {
    whereClause.OR = [
      {
        startDate: { lte: to },
        endDate: { gte: from },
      },
    ];
  }

  const events = await prisma.calendarEvent.findMany({
    where: whereClause,
    orderBy: { startDate: 'asc' },
  });

  return events.map((event) => {
    if (event.recurrence === 'none') return event;
    return generateRecurringEvents(event, from, to);
  }).flat();
}

export async function getCalendarEventById(eventId: string) {
  return prisma.calendarEvent.findUnique({
    where: { id: eventId },
  });
}

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

export async function deleteCalendarEvent(eventId: string) {
  return prisma.calendarEvent.delete({
    where: { id: eventId },
  });
}

/**
 * Générer des événements récurrents.
 */
function generateRecurringEvents(event: any, from?: Date, to?: Date) {
  const recurringEvents = [];
  let currentDate = new Date(event.startDate);

  while (!to || currentDate <= to) {
    if (!from || currentDate >= from) {
      recurringEvents.push({
        ...event,
        startDate: new Date(currentDate),
        endDate: new Date(currentDate.getTime() + (new Date(event.endDate).getTime() - new Date(event.startDate).getTime())),
      });
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
