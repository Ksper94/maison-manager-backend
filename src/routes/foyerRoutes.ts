import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { createFoyerController, joinFoyerController } from '../controllers/foyerController';

const router = Router();

// POST /api/foyer/create
router.post('/create', authMiddleware, createFoyerController);

// POST /api/foyer/join
router.post('/join', authMiddleware, joinFoyerController);

export default router;
