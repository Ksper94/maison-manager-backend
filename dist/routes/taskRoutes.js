"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const taskController_1 = require("../controllers/taskController");
const router = (0, express_1.Router)();
// Créer une tâche
router.post('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.createTaskController);
// Récupérer toutes les tâches
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.getTasksController);
// Récupérer une tâche par ID
router.get('/:taskId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.getTaskByIdController);
// Mettre à jour une tâche
router.patch('/:taskId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.updateTaskController);
// Supprimer une tâche
router.delete('/:taskId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, taskController_1.deleteTaskController);
exports.default = router;
