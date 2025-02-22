"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.getTasksByFoyer = getTasksByFoyer;
exports.getTaskById = getTaskById;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
const db_1 = require("../config/db");
const date_fns_1 = require("date-fns"); // Importation correcte de subHours
/**
 * Créer une nouvelle tâche dans un foyer.
 * @param data - Les données de la tâche à créer.
 * @returns La tâche créée.
 */
async function createTask(data) {
    const { title, description, foyerId, assignedToId, points } = data;
    if (!title) {
        throw new Error('Le titre de la tâche est obligatoire.');
    }
    return db_1.prisma.task.create({
        data: {
            title,
            description,
            foyerId,
            assignedToId,
            points: points ?? 0,
        },
    });
}
/**
 * Récupérer les tâches d’un foyer, éventuellement filtrées par "completed".
 * Si completed est true, exclut les tâches complétées il y a plus de 24 heures.
 * @param foyerId - L'ID du foyer.
 * @param completed - Filtre optionnel pour les tâches complétées ou non.
 * @returns La liste des tâches correspondantes.
 */
async function getTasksByFoyer(foyerId, completed) {
    const whereClause = { foyerId };
    if (typeof completed === 'boolean') {
        whereClause.completed = completed;
        // Si on demande les tâches complétées, exclure celles de plus de 24h
        if (completed) {
            const twentyFourHoursAgo = (0, date_fns_1.subHours)(new Date(), 24);
            whereClause.completedAt = { gte: twentyFourHoursAgo };
        }
    }
    return db_1.prisma.task.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
            assignedTo: {
                select: { id: true, name: true, email: true },
            },
        },
    });
}
/**
 * Récupérer une tâche par son ID, en incluant la personne à qui elle est assignée.
 * @param taskId - L'ID de la tâche.
 * @returns La tâche correspondante ou null si introuvable.
 */
async function getTaskById(taskId) {
    return db_1.prisma.task.findUnique({
        where: { id: taskId },
        include: {
            assignedTo: {
                select: { id: true, name: true, email: true },
            },
        },
    });
}
/**
 * Mettre à jour une tâche existante.
 * Gère automatiquement completedAt lorsque completed est modifié.
 * @param data - Les données de mise à jour de la tâche.
 * @returns La tâche mise à jour.
 */
async function updateTask(data) {
    const { taskId, title, description, completed, points, assignedToId } = data;
    const existingTask = await db_1.prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) {
        throw new Error('Tâche introuvable.');
    }
    // Gérer completedAt automatiquement
    const completedAt = completed !== undefined
        ? completed
            ? new Date() // Si completed passe à true, set completedAt à maintenant
            : null // Si completed passe à false, reset completedAt
        : existingTask.completedAt;
    return db_1.prisma.task.update({
        where: { id: taskId },
        data: {
            title,
            description,
            completed,
            points,
            assignedToId,
            completedAt,
        },
        include: {
            assignedTo: true,
        },
    });
}
/**
 * Supprimer une tâche par son ID.
 * @param taskId - L'ID de la tâche à supprimer.
 * @returns La tâche supprimée.
 */
async function deleteTask(taskId) {
    return db_1.prisma.task.delete({ where: { id: taskId } });
}
