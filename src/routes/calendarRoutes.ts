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
 * Routes pour les événements standards
 */
router.post(
  '/',
  authMiddleware,
  hasFoyerMiddleware,
  createEventController
);

router.get(
  '/',
  authMiddleware,
  hasFoyerMiddleware,
  getEventsController
);

router.get(
  '/:eventId',
  authMiddleware,
  hasFoyerMiddleware,
  getEventByIdController
);

router.patch(
  '/:eventId',
  authMiddleware,
  hasFoyerMiddleware,
  updateEventController
);

router.delete(
  '/:eventId',
  authMiddleware,
  hasFoyerMiddleware,
  deleteEventController
);

/**
 * Route dédiée pour la création de plannings personnalisés
 */
router.post(
  '/planning',
  authMiddleware,
  hasFoyerMiddleware,
  createPlanningController
);

export default router;
