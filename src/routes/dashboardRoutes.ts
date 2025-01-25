// src/routes/dashboardRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { hasFoyerMiddleware } from '../middlewares/hasFoyerMiddleware';

const router = Router();

// GET /api/dashboard/
router.get('/', authMiddleware, hasFoyerMiddleware, (req, res) => {
  return res.json({ message: 'Bienvenue sur le dashboard !' });
});

// Tu peux ajouter d’autres endpoints liés au dashboard ici
// router.get('/something', ...)

export default router;
