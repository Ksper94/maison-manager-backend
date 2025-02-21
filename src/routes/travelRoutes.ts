import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { hasFoyerMiddleware } from '../middlewares/hasFoyerMiddleware';
import {
  createTravelIdeaController,
  getAllTravelIdeasController,
  getTravelIdeaByIdController,
  updateTravelIdeaController,
  deleteTravelIdeaController,
  voteForTravelIdeaController,
} from '../controllers/travelController';

const router = Router();

// Créer une idée de voyage
router.post('/', authMiddleware, hasFoyerMiddleware, createTravelIdeaController);

// Récupérer toutes les idées de voyage
router.get('/', authMiddleware, hasFoyerMiddleware, getAllTravelIdeasController);

// Récupérer une idée de voyage par ID
router.get('/:ideaId', authMiddleware, hasFoyerMiddleware, getTravelIdeaByIdController);

// Mettre à jour une idée de voyage
router.patch('/:ideaId', authMiddleware, hasFoyerMiddleware, updateTravelIdeaController);

// Supprimer une idée de voyage
router.delete('/:ideaId', authMiddleware, hasFoyerMiddleware, deleteTravelIdeaController);

// Voter pour une idée de voyage
router.post('/:ideaId/vote', authMiddleware, hasFoyerMiddleware, voteForTravelIdeaController);

export default router;