"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const calendarController_1 = require("../controllers/calendarController");
const router = (0, express_1.Router)();
// Créer un événement : POST /api/calendar
router.post('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.createEventController);
// Lire tous les événements d'un foyer : GET /api/calendar
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.getEventsController);
// Lire un événement spécifique : GET /api/calendar/:eventId
router.get('/:eventId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.getEventByIdController);
// Mettre à jour un événement : PATCH /api/calendar/:eventId
router.patch('/:eventId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.updateEventController);
// Supprimer un événement : DELETE /api/calendar/:eventId
router.delete('/:eventId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.deleteEventController);
exports.default = router;
