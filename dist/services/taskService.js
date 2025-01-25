"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.getTasksByFoyer = getTasksByFoyer;
exports.getTaskById = getTaskById;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
// src/services/taskService.ts
const db_1 = require("../config/db");
async function createTask(data) {
    const { title, description, foyerId, assignedToId, points } = data;
    // On peut vérifier la validité (title non vide, etc.)
    if (!title) {
        throw new Error('Le titre de la tâche est obligatoire.');
    }
    const newTask = await db_1.prisma.task.create({
        data: {
            title,
            description,
            foyerId,
            assignedToId,
            points: points ?? 0
        }
    });
    return newTask;
}
/**
 * Récupère la liste des tâches d'un foyer,
 * éventuellement filtrées par complétion (true/false).
 */
async function getTasksByFoyer(foyerId, completed) {
    const whereClause = { foyerId };
    if (typeof completed === 'boolean') {
        whereClause.completed = completed;
    }
    const tasks = await db_1.prisma.task.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
            assignedTo: {
                select: { id: true, name: true, email: true }
            }
        }
    });
    return tasks;
}
async function getTaskById(taskId) {
    const task = await db_1.prisma.task.findUnique({
        where: { id: taskId },
        include: {
            assignedTo: {
                select: { id: true, name: true, email: true }
            }
        }
    });
    return task;
}
async function updateTask(data) {
    const { taskId, title, description, completed, points, assignedToId } = data;
    const existingTask = await db_1.prisma.task.findUnique({
        where: { id: taskId }
    });
    if (!existingTask) {
        throw new Error('Tâche introuvable.');
    }
    // On stocke l'ancienne valeur de completed
    const wasCompleted = existingTask.completed;
    // Mettre à jour la tâche
    const updatedTask = await db_1.prisma.task.update({
        where: { id: taskId },
        data: {
            title,
            description,
            completed,
            points,
            assignedToId
        },
        include: {
            assignedTo: true // pour savoir qui est assigné
        }
    });
    // Si la tâche est maintenant completed et ne l'était pas avant,
    // on attribue les points au user assigné (s'il existe).
    if (completed === true && !wasCompleted) {
        // Par défaut, on considère que c'est l'utilisateur "assignéTo" qui gagne les points
        // (ou tu peux exiger un "completedById" si c'est un autre user).
        if (updatedTask.assignedTo) {
            await db_1.prisma.user.update({
                where: { id: updatedTask.assignedTo.id },
                data: {
                    // On additionne les points du user + la valeur de la tâche
                    points: {
                        increment: updatedTask.points // ex: 10
                    }
                }
            });
        }
    }
    return updatedTask;
}
async function deleteTask(taskId) {
    // Vérifier si la tâche existe
    const existingTask = await db_1.prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) {
        throw new Error('Tâche introuvable ou déjà supprimée.');
    }
    const deleted = await db_1.prisma.task.delete({
        where: { id: taskId }
    });
    return deleted;
}
