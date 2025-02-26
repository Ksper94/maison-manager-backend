// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';
import foyerRoutes from './foyerRoutes';
import dashboardRoutes from './dashboardRoutes';
import calendarRoutes from './calendarRoutes';
import taskRoutes from './taskRoutes';
import shoppingRoutes from './shoppingRoutes';
import leaderboardRoutes from './leaderboardRoutes';
import travelRoutes from './travelRoutes';
import recipeRoutes from './recipeRoutes';
import uploadRoutes from './uploadRoutes'; // Ajoutez cette ligne

export const router = Router();

router.use('/auth', authRoutes);
router.use('/foyer', foyerRoutes);

// Ici, on déclare que /dashboard pointe vers dashboardRoutes
router.use('/dashboard', dashboardRoutes);
router.use('/calendar', calendarRoutes);
router.use('/tasks', taskRoutes);
router.use('/shopping', shoppingRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/travel', travelRoutes);
router.use('/recipes', recipeRoutes);
router.use('/upload', uploadRoutes); // Ajoutez cette ligne