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

const router = Router();

/**
 * Routes pour la gestion du calendrier
 */

// Créer un événement : POST /api/calendar
router.post(
  '/',
  authMiddleware, // Vérifie l'authentification
  hasFoyerMiddleware, // Vérifie si l'utilisateur appartient à un foyer
  createEventController
);

// Lire tous les événements d'un foyer : GET /api/calendar
router.get(
  '/',
  authMiddleware, // Vérifie l'authentification
  hasFoyerMiddleware, // Vérifie si l'utilisateur appartient à un foyer
  getEventsController
);

// Lire un événement spécifique : GET /api/calendar/:eventId
router.get(
  '/:eventId',
  authMiddleware, // Vérifie l'authentification
  hasFoyerMiddleware, // Vérifie si l'utilisateur appartient à un foyer
  getEventByIdController
);

// Mettre à jour un événement : PATCH /api/calendar/:eventId
router.patch(
  '/:eventId',
  authMiddleware, // Vérifie l'authentification
  hasFoyerMiddleware, // Vérifie si l'utilisateur appartient à un foyer
  updateEventController
);

// Supprimer un événement : DELETE /api/calendar/:eventId
router.delete(
  '/:eventId',
  authMiddleware, // Vérifie l'authentification
  hasFoyerMiddleware, // Vérifie si l'utilisateur appartient à un foyer
  deleteEventController
);

export default router;
