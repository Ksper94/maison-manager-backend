import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { hasFoyerMiddleware } from '../middlewares/hasFoyerMiddleware';
import {
  createEventController,
  getEventsController,
  getEventByIdController,
  updateEventController,
  deleteEventController
} from '../controllers/calendarController';

const router = Router();

// Créer un événement : POST /api/calendar
router.post('/', authMiddleware, hasFoyerMiddleware, createEventController);

// Lire tous les événements d'un foyer : GET /api/calendar
router.get('/', authMiddleware, hasFoyerMiddleware, getEventsController);

// Lire un événement spécifique : GET /api/calendar/:eventId
router.get('/:eventId', authMiddleware, hasFoyerMiddleware, getEventByIdController);

// Mettre à jour un événement : PATCH /api/calendar/:eventId
router.patch('/:eventId', authMiddleware, hasFoyerMiddleware, updateEventController);

// Supprimer un événement : DELETE /api/calendar/:eventId
router.delete('/:eventId', authMiddleware, hasFoyerMiddleware, deleteEventController);

export default router;
