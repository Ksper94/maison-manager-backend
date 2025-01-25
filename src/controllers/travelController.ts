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

export async function createTravelIdeaController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { foyerId: true, name: true },
    });
    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour proposer une idée de voyage.' });
    }

    const { title, description, location } = req.body;

    const idea = await createTravelIdea({
      title,
      description,
      location,
      foyerId: user.foyerId,
      creatorId: userId,
    });

    // Notifications push pour informer les membres du foyer
    const members = await prisma.user.findMany({
      where: { foyerId: user.foyerId },
      select: { pushToken: true },
    });

    const pushTokens = members
      .map((member) => member.pushToken)
      .filter((token): token is string => Boolean(token));

    for (const token of pushTokens) {
      await sendPushNotification(
        token,
        `${user.name} a proposé une nouvelle idée de voyage : "${title}".`
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

export async function getAllTravelIdeasController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
    }

    // Tri par votes si ?sortByVotes=true
    const sortByVotes = req.query.sortByVotes === 'true';

    const ideas = await getAllTravelIdeas(user.foyerId, sortByVotes);
    return res.status(200).json(ideas);
  } catch (error) {
    next(error);
  }
}

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

export async function updateTravelIdeaController(req: Request, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;
    const { title, description, location } = req.body;

    const updated = await updateTravelIdea({ ideaId, title, description, location });

    // Notifications push pour informer les membres du foyer
    const idea = await prisma.travelIdea.findUnique({
      where: { id: ideaId },
      select: { foyerId: true, title: true },
    });

    if (idea) {
      const members = await prisma.user.findMany({
        where: { foyerId: idea.foyerId },
        select: { pushToken: true },
      });

      const pushTokens = members
        .map((member) => member.pushToken)
        .filter((token): token is string => Boolean(token));

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

export async function deleteTravelIdeaController(req: Request, res: Response, next: NextFunction) {
  try {
    const ideaId = req.params.ideaId;

    // Récupération de l'idée avant suppression
    const idea = await prisma.travelIdea.findUnique({
      where: { id: ideaId },
      select: { foyerId: true, title: true },
    });

    if (!idea) {
      return res.status(404).json({ message: 'Idée introuvable ou déjà supprimée.' });
    }

    // Suppression
    const deleted = await deleteTravelIdea(ideaId);

    // Notifications push pour informer les membres du foyer
    const members = await prisma.user.findMany({
      where: { foyerId: idea.foyerId },
      select: { pushToken: true },
    });

    const pushTokens = members
      .map((member) => member.pushToken)
      .filter((token): token is string => Boolean(token));

    for (const token of pushTokens) {
      await sendPushNotification(token, `L'idée de voyage "${idea.title}" a été supprimée.`);
    }

    return res.status(200).json({
      message: 'Idée de voyage supprimée.',
      idea: deleted,
    });
  } catch (error) {
    next(error);
  }
}

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
