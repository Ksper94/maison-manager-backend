import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { hasFoyerMiddleware } from '../middlewares/hasFoyerMiddleware';

import {
  createRecipeController,
  getAllRecipesController,
  getRecipeByIdController,
  updateRecipeController,
  deleteRecipeController,
  voteForRecipeController,
} from '../controllers/recipeController';

const router = Router();

// POST /api/recipes
router.post('/', authMiddleware, hasFoyerMiddleware, createRecipeController);

// GET /api/recipes
router.get('/', authMiddleware, hasFoyerMiddleware, getAllRecipesController);

// GET /api/recipes/:recipeId
router.get('/:recipeId', authMiddleware, hasFoyerMiddleware, getRecipeByIdController);

// PATCH /api/recipes/:recipeId
router.patch('/:recipeId', authMiddleware, hasFoyerMiddleware, updateRecipeController);

// DELETE /api/recipes/:recipeId
router.delete('/:recipeId', authMiddleware, hasFoyerMiddleware, deleteRecipeController);

// POST /api/recipes/:recipeId/vote
router.post('/:recipeId/vote', authMiddleware, hasFoyerMiddleware, voteForRecipeController);

export default router;
