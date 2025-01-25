"use strict";
// src/services/calendarService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCalendarEvent = createCalendarEvent;
exports.getCalendarEvents = getCalendarEvents;
exports.getCalendarEventById = getCalendarEventById;
exports.updateCalendarEvent = updateCalendarEvent;
exports.deleteCalendarEvent = deleteCalendarEvent;
const db_1 = require("../config/db");
/**
 * Crée un nouvel événement dans un foyer.
 * - Vérifie que la date de début est antérieure à la date de fin
 * - Optionnel : on peut vérifier le chevauchement avec d'autres événements
 */
async function createCalendarEvent(data) {
    const { title, description, startDate, endDate, foyerId, creatorId } = data;
    // 1. Vérification des dates
    if (startDate >= endDate) {
        throw new Error('La date de fin doit être postérieure à la date de début.');
    }
    // 2. (Optionnel) Vérifier si on autorise le chevauchement d’événements
    //    Par exemple, on peut interdire la création si ça chevauche déjà un autre event
    //    Dans ce cas, on effectue un findMany(...) avec un where sur la plage de dates
    //    Par exemple :
    // const overlapping = await prisma.calendarEvent.findMany({
    //   where: {
    //     foyerId: foyerId,
    //     OR: [
    //       {
    //         startDate: { lte: endDate },
    //         endDate: { gte: startDate }
    //       }
    //     ]
    //   }
    // });
    // if (overlapping.length > 0) {
    //   throw new Error('Un événement existe déjà sur la plage sélectionnée.');
    // }
    // 3. Créer l'événement dans la BDD
    const newEvent = await db_1.prisma.calendarEvent.create({
        data: {
            title,
            description,
            startDate,
            endDate,
            foyerId,
            creatorId,
        },
    });
    return newEvent;
}
/**
 * Récupère tous les événements d'un foyer, potentiellement filtrés par plage [from, to].
 * - Si from & to sont fournis, on récupère les événements qui se chevauchent
 *   avec [from, to].
 * - Sinon, on récupère tous les événements du foyer.
 */
async function getCalendarEvents(foyerId, from, to) {
    // On construit un whereClause dynamique
    const whereClause = {
        foyerId,
    };
    // Si from et to sont définis, filtrer par chevauchement
    if (from && to) {
        whereClause.OR = [
            {
                startDate: { lte: to },
                endDate: { gte: from }
            }
        ];
    }
    // Tri par date de début ascendante
    const events = await db_1.prisma.calendarEvent.findMany({
        where: whereClause,
        orderBy: { startDate: 'asc' }
    });
    return events;
}
/**
 * Récupère un événement précis (via son ID).
 * - @param eventId
 */
async function getCalendarEventById(eventId) {
    const event = await db_1.prisma.calendarEvent.findUnique({
        where: { id: eventId }
    });
    return event;
}
/**
 * Met à jour un événement existant.
 * - Vérifie si la nouvelle date de fin est bien après la date de début.
 * - Optionnel : vérifier que l'utilisateur a le droit de modifier.
 */
async function updateCalendarEvent(data) {
    const { eventId, title, description, startDate, endDate, updaterId } = data;
    // 1. Récupérer l'événement pour vérifier la cohérence
    const existingEvent = await db_1.prisma.calendarEvent.findUnique({
        where: { id: eventId }
    });
    if (!existingEvent) {
        throw new Error('Événement introuvable.');
    }
    // 2. Vérifier que la personne qui met à jour est le créateur
    //    (si c'est ta règle métier)
    // if (updaterId && existingEvent.creatorId && existingEvent.creatorId !== updaterId) {
    //   throw new Error('Vous ne pouvez pas modifier cet événement car vous ne l’avez pas créé.');
    // }
    // 3. Vérification date start/end
    if (startDate && endDate && startDate >= endDate) {
        throw new Error('La date de fin doit être postérieure à la date de début.');
    }
    // 4. Mettre à jour
    const updatedEvent = await db_1.prisma.calendarEvent.update({
        where: { id: eventId },
        data: {
            title,
            description,
            startDate,
            endDate
        }
    });
    return updatedEvent;
}
/**
 * Supprime un événement donné.
 * - Optionnel : vérifier que le user qui supprime est le créateur.
 */
async function deleteCalendarEvent(eventId, userId) {
    // 1. Récupérer l'événement
    const existingEvent = await db_1.prisma.calendarEvent.findUnique({
        where: { id: eventId }
    });
    if (!existingEvent) {
        throw new Error('Événement introuvable.');
    }
    // 2. Vérifier que le userId correspond au creatorId, si ta logique l’exige
    // if (userId && existingEvent.creatorId && existingEvent.creatorId !== userId) {
    //   throw new Error('Vous ne pouvez pas supprimer cet événement car vous ne l’avez pas créé.');
    // }
    // 3. Supprimer l'événement
    const deletedEvent = await db_1.prisma.calendarEvent.delete({
        where: { id: eventId }
    });
    return deletedEvent;
}
