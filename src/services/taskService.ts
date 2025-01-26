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

export async function getTasksByFoyer(foyerId: string, completed?: boolean) {
  const whereClause: any = { foyerId };
  if (typeof completed === 'boolean') {
    whereClause.completed = completed;
  }

  return prisma.task.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });
}

export async function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
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

export async function updateTask(data: UpdateTaskInput) {
  const { taskId, title, description, completed, points, assignedToId } = data;

  const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existingTask) {
    throw new Error('Tâche introuvable.');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { title, description, completed, points, assignedToId },
    include: { assignedTo: true },
  });
}

export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } });
}
