"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskController = createTaskController;
exports.getTasksController = getTasksController;
exports.getTaskByIdController = getTaskByIdController;
exports.updateTaskController = updateTaskController;
exports.deleteTaskController = deleteTaskController;
const taskService_1 = require("../services/taskService");
const db_1 = require("../config/db");
const notifications_1 = require("../utils/notifications");
/**
 * Récupère l'enregistrement pivot UserFoyer pour un user,
 * incluant son nom et le foyerId.
 * Retourne null si le user n'appartient à aucun foyer.
 */
async function getUserPivot(userId) {
    if (!userId)
        return null;
    // On inclut "user" pour récupérer le name, 
    // mais on pourrait faire autrement si on veut plus d'infos
    return db_1.prisma.userFoyer.findFirst({
        where: { userId },
        include: {
            user: {
                select: { name: true },
            },
        },
    });
}
/**
 * Récupère tous les pushTokens des membres d'un foyer.
 */
async function getFoyerMembersPushTokens(foyerId) {
    const userFoyerRecords = await db_1.prisma.userFoyer.findMany({
        where: { foyerId },
        include: {
            user: {
                select: { pushToken: true },
            },
        },
    });
    return userFoyerRecords
        .map((uf) => uf.user?.pushToken)
        .filter((token) => Boolean(token));
}
/**
 * Contrôleur pour créer une nouvelle tâche
 */
async function createTaskController(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        // Récupère pivot => foyerId + userName
        const userPivot = await getUserPivot(userId);
        if (!userPivot) {
            return res
                .status(403)
                .json({ message: 'Vous devez appartenir à un foyer pour créer une tâche.' });
        }
        const { title, description, assignedToId, points } = req.body;
        // Création de la tâche dans la table "Task"
        const task = await (0, taskService_1.createTask)({
            title,
            description,
            foyerId: userPivot.foyerId,
            assignedToId,
            points,
        });
        // Notification aux membres du foyer
        const pushTokens = await getFoyerMembersPushTokens(userPivot.foyerId);
        // userPivot.user contient { name: string }
        const creatorName = userPivot.user?.name || 'Quelqu\'un';
        for (const token of pushTokens) {
            await (0, notifications_1.sendPushNotification)(token, `${creatorName} a créé une nouvelle tâche : "${title}".`);
        }
        return res.status(201).json({ message: 'Tâche créée avec succès', task });
    }
    catch (error) {
        console.error('[createTaskController] Erreur :', error);
        next(error);
    }
}
/**
 * Contrôleur pour récupérer les tâches du foyer
 */
async function getTasksController(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        const userPivot = await getUserPivot(userId);
        if (!userPivot) {
            return res
                .status(403)
                .json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
        }
        // Filtre par "completed" dans la querystring
        const completed = req.query.completed === 'true'
            ? true
            : req.query.completed === 'false'
                ? false
                : undefined;
        const tasks = await (0, taskService_1.getTasksByFoyer)(userPivot.foyerId, completed);
        return res.status(200).json(tasks);
    }
    catch (error) {
        console.error('[getTasksController] Erreur :', error);
        next(error);
    }
}
/**
 * Contrôleur pour récupérer une tâche par ID
 */
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
        console.error('[getTaskByIdController] Erreur :', error);
        next(error);
    }
}
/**
 * Contrôleur pour mettre à jour une tâche
 */
async function updateTaskController(req, res, next) {
    try {
        const taskId = req.params.taskId;
        const { title, description, completed, points, assignedToId } = req.body;
        // Mise à jour de la tâche
        const updatedTask = await (0, taskService_1.updateTask)({
            taskId,
            title,
            description,
            completed,
            points,
            assignedToId,
        });
        // Si la tâche vient d'être marquée comme complétée, notifie le foyer
        if (completed) {
            const task = await db_1.prisma.task.findUnique({
                where: { id: taskId },
                select: { foyerId: true, title: true },
            });
            if (task) {
                const pushTokens = await getFoyerMembersPushTokens(task.foyerId);
                for (const token of pushTokens) {
                    await (0, notifications_1.sendPushNotification)(token, `La tâche "${task.title}" a été marquée comme complétée.`);
                }
            }
        }
        return res.status(200).json({ message: 'Tâche mise à jour.', task: updatedTask });
    }
    catch (error) {
        console.error('[updateTaskController] Erreur :', error);
        next(error);
    }
}
/**
 * Contrôleur pour supprimer une tâche
 */
async function deleteTaskController(req, res, next) {
    try {
        const taskId = req.params.taskId;
        // On récupère la tâche pour connaître son foyerId
        const task = await db_1.prisma.task.findUnique({
            where: { id: taskId },
            select: { title: true, foyerId: true },
        });
        if (!task) {
            return res
                .status(404)
                .json({ message: 'Tâche introuvable ou déjà supprimée.' });
        }
        // Suppression de la tâche via le service
        const deletedTask = await (0, taskService_1.deleteTask)(taskId);
        // Notification aux membres du foyer
        const pushTokens = await getFoyerMembersPushTokens(task.foyerId);
        for (const token of pushTokens) {
            await (0, notifications_1.sendPushNotification)(token, `La tâche "${task.title}" a été supprimée.`);
        }
        return res.status(200).json({ message: 'Tâche supprimée.', task: deletedTask });
    }
    catch (error) {
        console.error('[deleteTaskController] Erreur :', error);
        next(error);
    }
}
