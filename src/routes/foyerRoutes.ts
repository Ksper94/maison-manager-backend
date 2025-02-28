import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  createFoyerController,
  joinFoyerController,
  getUserProfileController,
  getUserFoyersController,
  updateFoyerRulesController, // <-- Assurez-vous de l'importer
} from '../controllers/foyerController';

const router = Router();

// POST /api/foyer/create
router.post('/create', authMiddleware, createFoyerController);

// POST /api/foyer/join
router.post('/join', authMiddleware, joinFoyerController);

// GET /api/foyer/me (profil de l'utilisateur connecté)
router.get('/me', authMiddleware, getUserProfileController);

// GET /api/foyer/user-foyers (liste des foyers)
router.get('/user-foyers', authMiddleware, getUserFoyersController);

/**
 * PUT /api/foyer/:foyerId/rules
 * Pour mettre à jour les règles du foyer identifié par :foyerId
 */
router.put('/:foyerId/rules', authMiddleware, updateFoyerRulesController);

export default router;
