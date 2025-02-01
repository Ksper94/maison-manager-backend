import { Router } from 'express';
import {
  register,
  login,
  getUserProfile,
  updateUserProfile,
} from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me - Récupérer le profil utilisateur
router.get('/me', authMiddleware, getUserProfile);

// PUT /api/auth/me - Mettre à jour le profil utilisateur
router.put('/me', authMiddleware, updateUserProfile);

export default router;
