import { prisma } from '../config/db';
import { subHours } from 'date-fns'; // Importation correcte de subHours

interface CreateTaskInput {
  title: string;
  description?: string;
  foyerId: string;
  assignedToId?: string;
  points?: number;
}

/**
 * Créer une nouvelle tâche dans un foyer.
 * @param data - Les données de la tâche à créer.
 * @returns La tâche créée.
 */
export async function createTask(data: CreateTaskInput) {
  const { title, description, foyerId, assignedToId, points } = data;

  if (!title) {
    throw new Error('Le titre de la tâche est obligatoire.');
  }

  return prisma.task.create({
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
export async function getTasksByFoyer(foyerId: string, completed?: boolean) {
  const whereClause: any = { foyerId };

  if (typeof completed === 'boolean') {
    whereClause.completed = completed;

    // Si on demande les tâches complétées, exclure celles de plus de 24h
    if (completed) {
      const twentyFourHoursAgo = subHours(new Date(), 24);
      whereClause.completedAt = { gte: twentyFourHoursAgo };
    }
  }

  return prisma.task.findMany({
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
export async function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  completed?: boolean;
  points?: number;
  assignedToId?: string;
}

/**
 * Mettre à jour une tâche existante.
 * Gère automatiquement completedAt lorsque completed est modifié.
 * @param data - Les données de mise à jour de la tâche.
 * @returns La tâche mise à jour.
 */
export async function updateTask(data: UpdateTaskInput) {
  const { taskId, title, description, completed, points, assignedToId } = data;

  const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existingTask) {
    throw new Error('Tâche introuvable.');
  }

  // Gérer completedAt automatiquement
  const completedAt = completed !== undefined
    ? completed
      ? new Date() // Si completed passe à true, set completedAt à maintenant
      : null // Si completed passe à false, reset completedAt
    : existingTask.completedAt;

  return prisma.task.update({
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
export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } });
}
