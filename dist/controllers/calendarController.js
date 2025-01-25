"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventController = createEventController;
exports.getEventsController = getEventsController;
exports.getEventByIdController = getEventByIdController;
exports.updateEventController = updateEventController;
exports.deleteEventController = deleteEventController;
const calendarService_1 = require("../services/calendarService");
const db_1 = require("../config/db"); // si besoin pour vérifs, etc.
async function createEventController(req, res, next) {
    try {
        // On récupère l'userId via authMiddleware
        const userId = req.userId;
        // On récupère la date du foyer => hasFoyerMiddleware aura déjà validé
        // Mais si on veut être sûr, on peut re-checker en BDD
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Impossible de créer un événement si pas de foyer.' });
        }
        const { title, description, startDate, endDate } = req.body;
        if (!title || !startDate || !endDate) {
            return res.status(400).json({ message: 'Champs title, startDate et endDate obligatoires.' });
        }
        // On appelle le service
        const event = await (0, calendarService_1.createCalendarEvent)({
            title,
            description,
            startDate: new Date(startDate), // attention format
            endDate: new Date(endDate),
            foyerId: user.foyerId,
            creatorId: userId
        });
        return res.status(201).json({
            message: 'Événement créé avec succès.',
            event
        });
    }
    catch (error) {
        next(error);
    }
}
async function getEventsController(req, res, next) {
    try {
        const userId = req.userId;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour voir les événements.' });
        }
        // Possibilité de passer ?from=...&to=... dans la query pour filtrer
        const from = req.query.from ? new Date(String(req.query.from)) : undefined;
        const to = req.query.to ? new Date(String(req.query.to)) : undefined;
        const events = await (0, calendarService_1.getCalendarEvents)(user.foyerId, from, to);
        return res.status(200).json(events);
    }
    catch (error) {
        next(error);
    }
}
async function getEventByIdController(req, res, next) {
    try {
        const eventId = req.params.eventId;
        const event = await (0, calendarService_1.getCalendarEventById)(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Événement introuvable.' });
        }
        return res.status(200).json(event);
    }
    catch (error) {
        next(error);
    }
}
async function updateEventController(req, res, next) {
    try {
        const eventId = req.params.eventId;
        // On peut vérifier que l'utilisateur a accès à l'event, etc.
        // Par ex. on récupère l'event, check si l'event.foyerId === user.foyerId
        // C'est une question de logique de sécurité/permissions
        const { title, description, startDate, endDate } = req.body;
        const updatedEvent = await (0, calendarService_1.updateCalendarEvent)({
            eventId,
            title,
            description,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        return res.status(200).json({
            message: 'Événement mis à jour.',
            event: updatedEvent
        });
    }
    catch (error) {
        next(error);
    }
}
async function deleteEventController(req, res, next) {
    try {
        const eventId = req.params.eventId;
        // idem, on peut vérifier que l'utilisateur a le droit de supprimer
        const deleted = await (0, calendarService_1.deleteCalendarEvent)(eventId);
        return res.status(200).json({
            message: 'Événement supprimé.',
            event: deleted
        });
    }
    catch (error) {
        next(error);
    }
}
