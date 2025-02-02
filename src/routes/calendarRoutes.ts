import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { hasFoyerMiddleware } from '../middlewares/hasFoyerMiddleware';
import {
  createEventController,
  getEventsController,
  getEventByIdController,
  updateEventController,
  deleteEventController,
} from '../controllers/calendarController';
import { createPlanningController } from '../controllers/calendarPlanningController';

const router = Router();

/**
 * Routes pour la gestion du calendrier (événements standards)
 */

// Créer un événement standard : POST /api/calendar
router.post(
  '/',
  authMiddleware,       // Vérifie l'authentification
  hasFoyerMiddleware,   // Vérifie si l'utilisateur appartient à un foyer
  createEventController
);

// Lire tous les événements d'un foyer : GET /api/calendar
router.get(
  '/',
  authMiddleware,
  hasFoyerMiddleware,
  getEventsController
);

// Lire un événement spécifique : GET /api/calendar/:eventId
router.get(
  '/:eventId',
  authMiddleware,
  hasFoyerMiddleware,
  getEventByIdController
);

// Mettre à jour un événement : PATCH /api/calendar/:eventId
router.patch(
  '/:eventId',
  authMiddleware,
  hasFoyerMiddleware,
  updateEventController
);

// Supprimer un événement : DELETE /api/calendar/:eventId
router.delete(
  '/:eventId',
  authMiddleware,
  hasFoyerMiddleware,
  deleteEventController
);

/**
 * Route dédiée pour la création de plannings personnalisés
 * (qui décomposent le planning en plusieurs événements).
 * Endpoint : POST /api/calendar/planning
 */
router.post(
  '/planning',
  authMiddleware,
  hasFoyerMiddleware,
  createPlanningController
);

export default router;
