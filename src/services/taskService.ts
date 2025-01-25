// src/services/taskService.ts
import { prisma } from '../config/db';

interface CreateTaskInput {
  title: string;
  description?: string;
  foyerId: string;
  assignedToId?: string;
  points?: number;
}

export async function createTask(data: CreateTaskInput) {
  const { title, description, foyerId, assignedToId, points } = data;

  // On peut vérifier la validité (title non vide, etc.)
  if (!title) {
    throw new Error('Le titre de la tâche est obligatoire.');
  }

  const newTask = await prisma.task.create({
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
export async function getTasksByFoyer(foyerId: string, completed?: boolean) {
    const whereClause: any = { foyerId };
    if (typeof completed === 'boolean') {
      whereClause.completed = completed;
    }
  
    const tasks = await prisma.task.findMany({
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
  export async function getTaskById(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    return task;
  }
  interface UpdateTaskInput {
    taskId: string;
    title?: string;
    description?: string;
    completed?: boolean;
    points?: number;
    assignedToId?: string;
  }
  
  export async function updateTask(data: UpdateTaskInput) {
    const { taskId, title, description, completed, points, assignedToId } = data;
  
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });
    if (!existingTask) {
      throw new Error('Tâche introuvable.');
    }
  
    // On stocke l'ancienne valeur de completed
    const wasCompleted = existingTask.completed;
  
    // Mettre à jour la tâche
    const updatedTask = await prisma.task.update({
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
        await prisma.user.update({
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
  
  export async function deleteTask(taskId: string) {
    // Vérifier si la tâche existe
    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) {
      throw new Error('Tâche introuvable ou déjà supprimée.');
    }
  
    const deleted = await prisma.task.delete({
      where: { id: taskId }
    });
    return deleted;
  }
        