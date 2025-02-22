"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const calendarController_1 = require("../controllers/calendarController");
const calendarPlanningController_1 = require("../controllers/calendarPlanningController");
const router = (0, express_1.Router)();
/**
 * Routes pour les événements standards
 */
router.post('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.createEventController);
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.getEventsController);
router.get('/:eventId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.getEventByIdController);
router.patch('/:eventId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.updateEventController);
router.delete('/:eventId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarController_1.deleteEventController);
/**
 * Route dédiée pour la création de plannings personnalisés
 */
router.post('/planning', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, calendarPlanningController_1.createPlanningController);
exports.default = router;
