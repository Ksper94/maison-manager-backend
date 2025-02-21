import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

// Interface pour la requête personnalisée (ajout de userId)
interface CustomRequest extends Request {
  userId?: string;
}

/**
 * Récupère l'enregistrement pivot UserFoyer pour un utilisateur,
 * incluant son foyerId. Retourne null si l'utilisateur n'appartient à aucun foyer.
 */
async function getUserPivot(userId: string) {
  if (!userId) return null;

  return prisma.userFoyer.findFirst({
    where: { userId },
  });
}

/**
 * Crée une nouvelle idée de voyage
 */
export async function createTravelIdeaController(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, location } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const userPivot = await getUserPivot(userId);
    if (!userPivot) {
      return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour créer une idée de voyage.' });
    }

    if (!title) {
      return res.status(400).json({ message: 'Le titre de l\'idée de voyage est obligatoire.' });
    }

    const travelIdea = await prisma.travelIdea.create({
      data: {
        title,
        description,
        location,
        foyerId: userPivot.foyerId,
        creatorId: userId,
      },
    });

    return res.status(201).json({ message: 'Idée de voyage créée avec succès', travelIdea });
  } catch (error) {
    console.error('[createTravelIdeaController] Erreur :', error);
    next(error);
  }
}

/**
 * Récupère toutes les idées de voyage d'un foyer
 */
export async function getAllTravelIdeasController(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const userPivot = await getUserPivot(userId);
    if (!userPivot) {
      return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
    }

    const travelIdeas = await prisma.travelIdea.findMany({
      where: { foyerId: userPivot.foyerId },
    });

    return res.status(200).json(travelIdeas);
  } catch (error) {
    console.error('[getAllTravelIdeasController] Erreur :', error);
    next(error);
  }
}

/**
 * Récupère une idée de voyage par son ID
 */
export async function getTravelIdeaByIdController(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const userPivot = await getUserPivot(userId);
    if (!userPivot) {
      return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
    }

    const travelIdea = await prisma.travelIdea.findFirst({
      where: { id: ideaId, foyerId: userPivot.foyerId },
    });

    if (!travelIdea) {
      return res.status(404).json({ message: 'Idée de voyage introuvable.' });
    }

    return res.status(200).json(travelIdea);
  } catch (error) {
    console.error('[getTravelIdeaByIdController] Erreur :', error);
    next(error);
  }
}

/**
 * Met à jour une idée de voyage
 */
export async function updateTravelIdeaController(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;
    const { title, description, location } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const userPivot = await getUserPivot(userId);
    if (!userPivot) {
      return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
    }

    const travelIdea = await prisma.travelIdea.findFirst({
      where: { id: ideaId, foyerId: userPivot.foyerId },
    });

    if (!travelIdea) {
      return res.status(404).json({ message: 'Idée de voyage introuvable.' });
    }

    const updatedTravelIdea = await prisma.travelIdea.update({
      where: { id: ideaId },
      data: {
        title,
        description,
        location,
      },
    });

    return res.status(200).json({ message: 'Idée de voyage mise à jour.', travelIdea: updatedTravelIdea });
  } catch (error) {
    console.error('[updateTravelIdeaController] Erreur :', error);
    next(error);
  }
}

/**
 * Supprime une idée de voyage
 */
export async function deleteTravelIdeaController(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const userPivot = await getUserPivot(userId);
    if (!userPivot) {
      return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
    }

    const travelIdea = await prisma.travelIdea.findFirst({
      where: { id: ideaId, foyerId: userPivot.foyerId },
    });

    if (!travelIdea) {
      return res.status(404).json({ message: 'Idée de voyage introuvable ou déjà supprimée.' });
    }

    await prisma.travelIdea.delete({
      where: { id: ideaId },
    });

    return res.status(200).json({ message: 'Idée de voyage supprimée.' });
  } catch (error) {
    console.error('[deleteTravelIdeaController] Erreur :', error);
    next(error);
  }
}

/**
 * Vote pour une idée de voyage
 */
export async function voteForTravelIdeaController(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const userPivot = await getUserPivot(userId);
    if (!userPivot) {
      return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
    }

    const travelIdea = await prisma.travelIdea.findFirst({
      where: { id: ideaId, foyerId: userPivot.foyerId },
    });

    if (!travelIdea) {
      return res.status(404).json({ message: 'Idée de voyage introuvable.' });
    }

    // Vérifie si l'utilisateur a déjà voté
    const existingVote = await prisma.travelIdeaVote.findUnique({
      where: {
        travelIdeaId_userId: {
          travelIdeaId: ideaId,
          userId,
        },
      },
    });

    if (existingVote) {
      return res.status(400).json({ message: 'Vous avez déjà voté pour cette idée.' });
    }

    // Enregistre le vote
    await prisma.travelIdeaVote.create({
      data: {
        travelIdeaId: ideaId,
        userId,
      },
    });

    // Incrémente le compteur de votes
    await prisma.travelIdea.update({
      where: { id: ideaId },
      data: {
        votes: {
          increment: 1,
        },
      },
    });

    return res.status(200).json({ message: 'Vote enregistré avec succès.' });
  } catch (error) {
    console.error('[voteForTravelIdeaController] Erreur :', error);
    next(error);
  }
}
