// src/routes/leaderboardRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { hasFoyerMiddleware } from '../middlewares/hasFoyerMiddleware';
import { getLeaderboardController } from '../controllers/leaderboardController';

const router = Router();

router.get('/', authMiddleware, hasFoyerMiddleware, getLeaderboardController);

export default router;
