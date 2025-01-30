// src/routes/foyerRoute.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  createFoyerController,
  joinFoyerController,
  getUserProfileController,
  getUserFoyersController,
} from '../controllers/foyerController';

const router = Router();

// POST /api/foyer/create
router.post('/create', authMiddleware, createFoyerController);

// POST /api/foyer/join
router.post('/join', authMiddleware, joinFoyerController);

// GET /api/foyer/me
router.get('/me', authMiddleware, getUserProfileController);

// GET /api/foyer/user-foyers
router.get('/user-foyers', authMiddleware, getUserFoyersController);

export default router;
