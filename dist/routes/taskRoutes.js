"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/taskRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const taskController_1 = require("../controllers/taskController");
const router = (0, express_1.Router)();
// Créer une tâche => POST /api/tasks
router.post('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.createTaskController);
// Lire toutes les tâches du foyer => GET /api/tasks
// possibilité de filtrer ?completed=true/false
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.getTasksController);
// Lire une tâche précise => GET /api/tasks/:taskId
router.get('/:taskId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.getTaskByIdController);
// Mettre à jour une tâche => PATCH /api/tasks/:taskId
router.patch('/:taskId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.updateTaskController);
// Supprimer une tâche => DELETE /api/tasks/:taskId
router.delete('/:taskId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.deleteTaskController);
exports.default = router;
