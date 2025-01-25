// src/services/travelService.ts
import { prisma } from '../config/db';

interface CreateTravelIdeaInput {
  title: string;
  description?: string;
  location?: string;
  foyerId: string;
  creatorId?: string;
}

export async function createTravelIdea(data: CreateTravelIdeaInput) {
  const { title, description, location, foyerId, creatorId } = data;
  if (!title) {
    throw new Error('Le titre de l’idée de voyage est obligatoire.');
  }

  const newIdea = await prisma.travelIdea.create({
    data: {
      title,
      description,
      location,
      foyerId,
      creatorId,
    },
  });
  return newIdea;
}

/**
 * Récupère toutes les idées de voyage d'un foyer.
 * Possibilité de trier par votes descendants.
 */
export async function getAllTravelIdeas(foyerId: string, sortByVotes?: boolean) {
  // Ajout de "as const" pour que TypeScript reconnaisse la valeur littérale 'desc'
  const orderByClause = sortByVotes
    ? { votes: 'desc' as const }
    : { createdAt: 'desc' as const };

  const ideas = await prisma.travelIdea.findMany({
    where: { foyerId },
    orderBy: orderByClause,
    include: {
      creator: {
        select: { id: true, name: true },
      },
    },
  });
  return ideas;
}

/**
 * Récupère une idée de voyage précise
 */
export async function getTravelIdeaById(ideaId: string) {
  const idea = await prisma.travelIdea.findUnique({
    where: { id: ideaId },
    include: {
      creator: true,
    },
  });
  return idea;
}

/**
 * Met à jour une idée de voyage (titre, description, location).
 */
interface UpdateTravelIdeaInput {
  ideaId: string;
  title?: string;
  description?: string;
  location?: string;
}

export async function updateTravelIdea(data: UpdateTravelIdeaInput) {
  const { ideaId, title, description, location } = data;

  const existing = await prisma.travelIdea.findUnique({
    where: { id: ideaId },
  });
  if (!existing) {
    throw new Error('Idée de voyage introuvable.');
  }

  const updated = await prisma.travelIdea.update({
    where: { id: ideaId },
    data: {
      title,
      description,
      location,
    },
  });
  return updated;
}

/**
 * Supprime une idée de voyage.
 */
export async function deleteTravelIdea(ideaId: string) {
  const existing = await prisma.travelIdea.findUnique({
    where: { id: ideaId },
  });
  if (!existing) {
    throw new Error('Idée de voyage introuvable ou déjà supprimée.');
  }

  const deleted = await prisma.travelIdea.delete({
    where: { id: ideaId },
  });
  return deleted;
}

/**
 * Vote (like) pour l'idée (incrementer `votes`).
 */
export async function voteForTravelIdea(ideaId: string) {
  const existing = await prisma.travelIdea.findUnique({
    where: { id: ideaId },
  });
  if (!existing) {
    throw new Error('Idée de voyage introuvable.');
  }

  const updated = await prisma.travelIdea.update({
    where: { id: ideaId },
    data: {
      votes: {
        increment: 1,
      },
    },
  });
  return updated;
}
