import { Request, Response, NextFunction } from 'express';
import {
  createTask,
  getTasksByFoyer,
  getTaskById,
  updateTask,
  deleteTask,
} from '../services/taskService';
import { prisma } from '../config/db';
import { sendPushNotification } from '../utils/notifications';

/**
 * Création d'une nouvelle tâche
 */
export async function createTaskController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { foyerId: true, name: true },
    });
    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour créer une tâche.' });
    }

    const { title, description, assignedToId, points } = req.body;

    const task = await createTask({
      title,
      description,
      foyerId: user.foyerId,
      assignedToId,
      points,
    });

    const members = await prisma.user.findMany({
      where: { foyerId: user.foyerId },
      select: { pushToken: true },
    });

    const pushTokens = members
      .map((member) => member.pushToken)
      .filter((token): token is string => Boolean(token));

    for (const token of pushTokens) {
      await sendPushNotification(token, `${user.name} a créé une nouvelle tâche : "${title}".`);
    }

    return res.status(201).json({
      message: 'Tâche créée avec succès',
      task,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Récupération de toutes les tâches
 */
export async function getTasksController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { foyerId: true } });
    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
    }

    const completedQuery = req.query.completed as string | undefined;
    let completed: boolean | undefined = undefined;
    if (completedQuery === 'true') completed = true;
    if (completedQuery === 'false') completed = false;

    const tasks = await getTasksByFoyer(user.foyerId, completed);
    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
}

/**
 * Récupération d'une tâche par ID
 */
export async function getTaskByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId;

    const task = await getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }

    return res.status(200).json(task);
  } catch (error: any) {
    next(error);
  }
}

/**
 * Mise à jour d'une tâche
 */
export async function updateTaskController(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId;
    const { title, description, completed, points, assignedToId } = req.body;

    const updated = await updateTask({
      taskId,
      title,
      description,
      completed,
      points,
      assignedToId,
    });

    if (completed) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { foyerId: true, title: true },
      });

      if (task) {
        const members = await prisma.user.findMany({
          where: { foyerId: task.foyerId },
          select: { pushToken: true },
        });

        const pushTokens = members
          .map((member) => member.pushToken)
          .filter((token): token is string => Boolean(token));

        for (const token of pushTokens) {
          await sendPushNotification(token, `La tâche "${task.title}" a été marquée comme complétée.`);
        }
      }
    }

    return res.status(200).json({
      message: 'Tâche mise à jour.',
      task: updated,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Suppression d'une tâche
 */
export async function deleteTaskController(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId;

    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { title: true, foyerId: true } });
    if (!task) {
      return res.status(404).json({ message: 'Tâche introuvable ou déjà supprimée.' });
    }

    const deleted = await deleteTask(taskId);

    const members = await prisma.user.findMany({
      where: { foyerId: task.foyerId },
      select: { pushToken: true },
    });

    const pushTokens = members
      .map((member) => member.pushToken)
      .filter((token): token is string => Boolean(token));

    for (const token of pushTokens) {
      await sendPushNotification(token, `La tâche "${task.title}" a été supprimée.`);
    }

    return res.status(200).json({
      message: 'Tâche supprimée.',
      task: deleted,
    });
  } catch (error: any) {
    next(error);
  }
}
