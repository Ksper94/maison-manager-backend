import { prisma } from '../config/db';

interface CreateTravelIdeaInput {
  title: string;
  description?: string;
  location?: string;
  foyerId: string;
  creatorId?: string;
}

/**
 * Crée une nouvelle idée de voyage pour un foyer.
 */
export async function createTravelIdea(data: CreateTravelIdeaInput) {
  const { title, description, location, foyerId, creatorId } = data;
  if (!title) {
    throw new Error('Le titre de l’idée de voyage est obligatoire.');
  }

  // Création en base
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
 * Récupère toutes les idées de voyage d'un foyer,
 * avec possibilité de trier par nombre de votes.
 */
export async function getAllTravelIdeas(foyerId: string, sortByVotes?: boolean) {
  // On choisit l'ordre de tri
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
 * Récupère une idée de voyage précise par ID.
 */
export async function getTravelIdeaById(ideaId: string) {
  const idea = await prisma.travelIdea.findUnique({
    where: { id: ideaId },
    include: {
      creator: true, // Inclure toutes les infos du créateur
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

  // Vérifie l'existence
  const existing = await prisma.travelIdea.findUnique({
    where: { id: ideaId },
  });
  if (!existing) {
    throw new Error('Idée de voyage introuvable.');
  }

  // Mise à jour
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
 * Supprime une idée de voyage par ID.
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
 * Incrémente de 1 le champ `votes` de l’idée de voyage.
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
      votes: { increment: 1 },
    },
  });
  return updated;
}
