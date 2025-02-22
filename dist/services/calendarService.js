"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCalendarEvent = createCalendarEvent;
exports.createPlanningEvent = createPlanningEvent;
exports.getCalendarEvents = getCalendarEvents;
exports.getCalendarEventById = getCalendarEventById;
exports.updateCalendarEvent = updateCalendarEvent;
exports.deleteCalendarEvent = deleteCalendarEvent;
const db_1 = require("../config/db");
/* =================================================== */
/*                 Fonctions de base                   */
/* =================================================== */
async function createCalendarEvent(data) {
    const { title, description, startDate, endDate, recurrence, foyerId, creatorId } = data;
    // Validation basique
    if (recurrence !== 'none' && startDate > endDate) {
        throw new Error('La date de fin doit être postérieure à la date de début pour les événements récurrents.');
    }
    else if (recurrence === 'none' && startDate >= endDate) {
        throw new Error('La date de fin doit être strictement postérieure à la date de début pour les événements non récurrents.');
    }
    return db_1.prisma.calendarEvent.create({
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
async function createPlanningEvent(data) {
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
            console.log(`[createPlanningEvent] Jour ${day} => start=${startDate.toISOString()}, end=${endDate.toISOString()}`);
            if (startDate >= endDate) {
                throw new Error(`La date de fin doit être postérieure à la date de début pour le jour ${day}`);
            }
            // monthlyOneOff => on enregistre "none" (événement ponctuel)
            const eventRecurrence = data.recurrence === 'monthlyOneOff' ? 'none' : 'monthly';
            const event = await db_1.prisma.calendarEvent.create({
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
    }
    else if (data.recurrence === 'weekly') {
        const dayOfWeekMapping = {
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
            if (daysToAdd < 0)
                daysToAdd += 7;
            if (daysToAdd === 0) {
                // Si on est déjà le bon jour, on vérifie si on doit le "pousser" à la semaine prochaine
                // selon votre logique. Ici, on considère qu'on peut l'ajouter pour aujourd'hui si l'heure n'est pas déjà passée.
            }
            const eventDateBase = new Date(baseDate);
            eventDateBase.setDate(baseDate.getDate() + daysToAdd);
            // Construction de la date
            const startDate = new Date(eventDateBase.getFullYear(), eventDateBase.getMonth(), eventDateBase.getDate(), startH, startM, 0);
            const endDate = new Date(eventDateBase.getFullYear(), eventDateBase.getMonth(), eventDateBase.getDate(), endH, endM, 0);
            if (startDate >= endDate) {
                throw new Error(`La date de fin doit être postérieure à la date de début pour ${dayKey}`);
            }
            const event = await db_1.prisma.calendarEvent.create({
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
    }
    else {
        throw new Error('Type de planning non supporté (must be weekly, monthly, or monthlyOneOff).');
    }
    console.log('[createPlanningEvent] Tous les événements créés :', events);
    return events;
}
/**
 * Récupération de tous les events d'un foyer
 */
async function getCalendarEvents(foyerId, from, to) {
    const whereClause = { foyerId };
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
    const events = await db_1.prisma.calendarEvent.findMany({
        where: whereClause,
        orderBy: { startDate: 'asc' },
        take: 1000,
    });
    return events.map((event) => {
        if (event.recurrence === 'none')
            return event;
        // Sinon, générer occurrences récurrentes => ex: daily, weekly, monthly
        return generateRecurringEvents(event, from, to);
    }).flat();
}
async function getCalendarEventById(eventId) {
    return db_1.prisma.calendarEvent.findUnique({ where: { id: eventId } });
}
async function updateCalendarEvent(data) {
    const { eventId, title, description, startDate, endDate, recurrence } = data;
    if (startDate && endDate && startDate >= endDate) {
        throw new Error('La date de fin doit être postérieure à la date de début.');
    }
    return db_1.prisma.calendarEvent.update({
        where: { id: eventId },
        data: { title, description, startDate, endDate, recurrence },
    });
}
async function deleteCalendarEvent(eventId) {
    return db_1.prisma.calendarEvent.delete({ where: { id: eventId } });
}
/**
 * Génère les occurrences récurrentes (daily, weekly, monthly, yearly).
 * On peut affiner la logique si besoin (ex: stopper après X occurrences).
 */
function generateRecurringEvents(event, from, to) {
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
