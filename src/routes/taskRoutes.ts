import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { hasFoyerMiddleware } from '../middlewares/hasFoyerMiddleware';
import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController,
} from '../controllers/taskController';

const router = Router();

// Créer une tâche
router.post('/', authMiddleware, hasFoyerMiddleware, createTaskController);

// Récupérer toutes les tâches
router.get('/', authMiddleware, hasFoyerMiddleware, getTasksController);

// Récupérer une tâche par ID
router.get('/:taskId', authMiddleware, hasFoyerMiddleware, getTaskByIdController);

// Mettre à jour une tâche
router.patch('/:taskId', authMiddleware, hasFoyerMiddleware, updateTaskController);

// Supprimer une tâche
router.delete('/:taskId', authMiddleware, hasFoyerMiddleware, deleteTaskController);

export default router;
