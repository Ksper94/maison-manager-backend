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

interface CustomRequest extends Request {
  userId?: string;
}

/**
 * Récupère l'enregistrement pivot UserFoyer pour un user,
 * incluant son nom et le foyerId.
 * Retourne null si le user n'appartient à aucun foyer.
 */
async function getUserPivot(userId: string) {
  if (!userId) return null;

  return prisma.userFoyer.findFirst({
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
async function getFoyerMembersPushTokens(foyerId: string): Promise<string[]> {
  const userFoyerRecords = await prisma.userFoyer.findMany({
    where: { foyerId },
    include: {
      user: {
        select: { pushToken: true },
      },
    },
  });

  return userFoyerRecords
    .map((uf) => uf.user?.pushToken)
    .filter((token): token is string => Boolean(token));
}

/**
 * Contrôleur pour créer une nouvelle tâche
 */
export async function createTaskController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const userPivot = await getUserPivot(userId);
    if (!userPivot) {
      return res
        .status(403)
        .json({ message: 'Vous devez appartenir à un foyer pour créer une tâche.' });
    }

    const { title, description, assignedToId, points } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Le titre de la tâche est obligatoire.' });
    }

    const task = await createTask({
      title,
      description,
      foyerId: userPivot.foyerId,
      assignedToId,
      points,
    });

    const pushTokens = await getFoyerMembersPushTokens(userPivot.foyerId);
    const creatorName = userPivot.user?.name || 'Quelqu\'un';

    for (const token of pushTokens) {
      await sendPushNotification(
        token,
        `${creatorName} a créé une nouvelle tâche : "${title}".`
      );
    }

    return res.status(201).json({ message: 'Tâche créée avec succès', task });
  } catch (error) {
    console.error('[createTaskController] Erreur :', error);
    next(error);
  }
}

/**
 * Contrôleur pour récupérer les tâches du foyer
 */
export async function getTasksController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
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

    const completed =
      req.query.completed === 'true'
        ? true
        : req.query.completed === 'false'
        ? false
        : undefined;

    const tasks = await getTasksByFoyer(userPivot.foyerId, completed);
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('[getTasksController] Erreur :', error);
    next(error);
  }
}

/**
 * Contrôleur pour récupérer une tâche par ID
 */
export async function getTaskByIdController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const taskId = req.params.taskId;

    const task = await getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error('[getTaskByIdController] Erreur :', error);
    next(error);
  }
}

/**
 * Contrôleur pour mettre à jour une tâche
 */
export async function updateTaskController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const taskId = req.params.taskId;
    const { title, description, completed, points, assignedToId } = req.body;

    const updatedTask = await updateTask({
      taskId,
      title,
      description,
      completed,
      points,
      assignedToId,
    });

    // Si la tâche vient d'être marquée comme complétée, ajouter un événement au calendrier
    if (completed && updatedTask.completedAt) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { foyerId: true, title: true },
      });

      if (task) {
        await prisma.calendarEvent.create({
          data: {
            title: `Tâche complétée : ${task.title}`,
            description: `La tâche "${task.title}" a été complétée.`,
            startDate: new Date(),
            endDate: new Date(),
            foyerId: task.foyerId,
            creatorId: req.userId, // Optionnel : ajouter le créateur
          },
        });

        // Notification aux membres du foyer
        const pushTokens = await getFoyerMembersPushTokens(task.foyerId);
        for (const token of pushTokens) {
          await sendPushNotification(
            token,
            `La tâche "${task.title}" a été marquée comme complétée.`
          );
        }
      }
    }

    return res.status(200).json({ message: 'Tâche mise à jour.', task: updatedTask });
  } catch (error) {
    console.error('[updateTaskController] Erreur :', error);
    next(error);
  }
}

/**
 * Contrôleur pour supprimer une tâche
 */
export async function deleteTaskController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const taskId = req.params.taskId;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, foyerId: true },
    });
    if (!task) {
      return res
        .status(404)
        .json({ message: 'Tâche introuvable ou déjà supprimée.' });
    }

    const deletedTask = await deleteTask(taskId);

    const pushTokens = await getFoyerMembersPushTokens(task.foyerId);
    for (const token of pushTokens) {
      await sendPushNotification(token, `La tâche "${task.title}" a été supprimée.`);
    }

    return res.status(200).json({ message: 'Tâche supprimée.', task: deletedTask });
  } catch (error) {
    console.error('[deleteTaskController] Erreur :', error);
    next(error);
  }
}
