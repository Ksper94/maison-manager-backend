import { Request, Response, NextFunction } from 'express';
import {
  createTravelIdea,
  getAllTravelIdeas,
  getTravelIdeaById,
  updateTravelIdea,
  deleteTravelIdea,
  voteForTravelIdea,
} from '../services/travelService';
import { prisma } from '../config/db';
import { sendPushNotification } from '../utils/notifications';

/**
 * Récupère la pivot (UserFoyer) du user pour obtenir (entre autres) foyerId + userName.
 * Retourne null si pas de pivot => user n'est dans aucun foyer.
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
 * Récupère tous les pushTokens des membres d'un foyer, via UserFoyer.
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
 * 1) Création d'une nouvelle idée de voyage
 */
export async function createTravelIdeaController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId as string;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // Récupérer le foyerId de l'utilisateur via pivot
    const userPivot = await getUserPivot(userId);
    if (!userPivot) {
      return res
        .status(403)
        .json({ message: 'Vous devez appartenir à un foyer pour proposer une idée de voyage.' });
    }

    const { title, description, location } = req.body;

    // Création de l'idée de voyage
    const idea = await createTravelIdea({
      title,
      description,
      location,
      foyerId: userPivot.foyerId,
      creatorId: userId,
    });

    // Notifications push pour informer les membres
    const pushTokens = await getFoyerMembersPushTokens(userPivot.foyerId);
    const userName = userPivot.user?.name || 'Quelqu’un';

    for (const token of pushTokens) {
      await sendPushNotification(
        token,
        `${userName} a proposé une nouvelle idée de voyage : "${title}".`
      );
    }

    return res.status(201).json({
      message: 'Idée de voyage créée avec succès.',
      idea,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2) Récupération de toutes les idées de voyage d'un foyer
 */
export async function getAllTravelIdeasController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId as string;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const userPivot = await getUserPivot(userId);
    if (!userPivot) {
      return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
    }

    // Tri par votes si ?sortByVotes=true
    const sortByVotes = req.query.sortByVotes === 'true';

    const ideas = await getAllTravelIdeas(userPivot.foyerId, sortByVotes);
    return res.status(200).json(ideas);
  } catch (error) {
    next(error);
  }
}

/**
 * 3) Récupération d'une idée de voyage par ID
 */
export async function getTravelIdeaByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;
    const idea = await getTravelIdeaById(ideaId);

    if (!idea) {
      return res.status(404).json({ message: 'Idée introuvable.' });
    }

    return res.status(200).json(idea);
  } catch (error) {
    next(error);
  }
}

/**
 * 4) Mise à jour d'une idée de voyage
 */
export async function updateTravelIdeaController(req: Request, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;
    const { title, description, location } = req.body;

    // Mise à jour
    const updated = await updateTravelIdea({ ideaId, title, description, location });

    // On récupère l'idée pour notifier le foyer
    const idea = await prisma.travelIdea.findUnique({
      where: { id: ideaId },
      select: { foyerId: true, title: true },
    });

    if (idea) {
      const pushTokens = await getFoyerMembersPushTokens(idea.foyerId);
      for (const token of pushTokens) {
        await sendPushNotification(
          token,
          `L'idée de voyage "${idea.title}" a été mise à jour.`
        );
      }
    }

    return res.status(200).json({
      message: 'Idée de voyage mise à jour.',
      idea: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 5) Suppression d'une idée de voyage
 */
export async function deleteTravelIdeaController(req: Request, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;

    // Récupération de l'idée avant suppression
    const idea = await prisma.travelIdea.findUnique({
      where: { id: ideaId },
      select: { foyerId: true, title: true },
    });

    if (!idea) {
      return res
        .status(404)
        .json({ message: 'Idée introuvable ou déjà supprimée.' });
    }

    // Suppression
    const deleted = await deleteTravelIdea(ideaId);

    // Notifications aux membres
    const pushTokens = await getFoyerMembersPushTokens(idea.foyerId);
    for (const token of pushTokens) {
      await sendPushNotification(
        token,
        `L'idée de voyage "${idea.title}" a été supprimée.`
      );
    }

    return res.status(200).json({
      message: 'Idée de voyage supprimée.',
      idea: deleted,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 6) Vote pour une idée de voyage
 */
export async function voteForTravelIdeaController(req: Request, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;

    const updated = await voteForTravelIdea(ideaId);
    return res.status(200).json({
      message: 'Vote enregistré.',
      idea: updated,
    });
  } catch (error) {
    next(error);
  }
}
