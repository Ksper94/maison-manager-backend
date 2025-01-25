"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskController = createTaskController;
exports.getTasksController = getTasksController;
exports.getTaskByIdController = getTaskByIdController;
exports.updateTaskController = updateTaskController;
exports.deleteTaskController = deleteTaskController;
const taskService_1 = require("../services/taskService");
const db_1 = require("../config/db"); // pour vérifier l'utilisateur/foyer
async function createTaskController(req, res, next) {
    try {
        const userId = req.userId;
        // Récupération de l'utilisateur pour connaître son foyer
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour créer une tâche.' });
        }
        const { title, description, assignedToId, points } = req.body;
        // On appelle le service
        const task = await (0, taskService_1.createTask)({
            title,
            description,
            foyerId: user.foyerId,
            assignedToId,
            points
        });
        return res.status(201).json({
            message: 'Tâche créée avec succès',
            task
        });
    }
    catch (error) {
        next(error);
    }
}
async function getTasksController(req, res, next) {
    try {
        const userId = req.userId;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
        }
        // On peut récupérer un paramètre ?completed=true/false
        const completedQuery = req.query.completed;
        let completed = undefined;
        if (completedQuery === 'true')
            completed = true;
        if (completedQuery === 'false')
            completed = false;
        const tasks = await (0, taskService_1.getTasksByFoyer)(user.foyerId, completed);
        return res.status(200).json(tasks);
    }
    catch (error) {
        next(error);
    }
}
async function getTaskByIdController(req, res, next) {
    try {
        const taskId = req.params.taskId;
        const task = await (0, taskService_1.getTaskById)(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Tâche introuvable.' });
        }
        return res.status(200).json(task);
    }
    catch (error) {
        next(error);
    }
}
async function updateTaskController(req, res, next) {
    try {
        const taskId = req.params.taskId;
        const { title, description, completed, points, assignedToId } = req.body;
        const updated = await (0, taskService_1.updateTask)({
            taskId,
            title,
            description,
            completed,
            points,
            assignedToId
        });
        return res.status(200).json({
            message: 'Tâche mise à jour.',
            task: updated
        });
    }
    catch (error) {
        next(error);
    }
}
async function deleteTaskController(req, res, next) {
    try {
        const taskId = req.params.taskId;
        const deleted = await (0, taskService_1.deleteTask)(taskId);
        return res.status(200).json({
            message: 'Tâche supprimée.',
            task: deleted
        });
    }
    catch (error) {
        next(error);
    }
}
