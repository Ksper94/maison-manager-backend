// src/routes/travelRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { hasFoyerMiddleware } from '../middlewares/hasFoyerMiddleware';

import {
  createTravelIdeaController,
  getAllTravelIdeasController,
  getTravelIdeaByIdController,
  updateTravelIdeaController,
  deleteTravelIdeaController,
  voteForTravelIdeaController
} from '../controllers/travelController';

const router = Router();

router.post('/', authMiddleware, hasFoyerMiddleware, createTravelIdeaController);
router.get('/', authMiddleware, hasFoyerMiddleware, getAllTravelIdeasController);
router.get('/:ideaId', authMiddleware, hasFoyerMiddleware, getTravelIdeaByIdController);
router.patch('/:ideaId', authMiddleware, hasFoyerMiddleware, updateTravelIdeaController);
router.delete('/:ideaId', authMiddleware, hasFoyerMiddleware, deleteTravelIdeaController);

// Endpoint pour voter
router.post('/:ideaId/vote', authMiddleware, hasFoyerMiddleware, voteForTravelIdeaController);

export default router;
