import { Request, Response, NextFunction } from 'express';
import { createFoyer, joinFoyer } from '../services/foyerService';
import { sendPushNotification } from '../utils/notifications';
import { prisma } from '../config/db'; // Import de Prisma

interface CustomRequest extends Request {
  userId?: string; // Ajout du champ userId pour typer correctement les requêtes
}

// POST /api/foyer/create
export async function createFoyerController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    const { name, rule } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    if (!name || !rule) {
      return res.status(400).json({ message: 'Les champs "name" et "rule" sont obligatoires.' });
    }

    const updatedUser = await createFoyer(userId, name, rule);

    if (updatedUser.pushToken) {
      await sendPushNotification(
        updatedUser.pushToken,
        `Votre foyer "${updatedUser.foyer?.name}" a été créé avec succès !`
      );
    }

    return res.status(201).json({
      message: 'Foyer créé avec succès',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        foyer: {
          id: updatedUser.foyer?.id,
          name: updatedUser.foyer?.name,
          code: updatedUser.foyer?.code,
          rule: updatedUser.foyer?.rule,
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[createFoyerController] Erreur :', error.message);
      return res.status(500).json({ message: 'Erreur interne', error: error.message });
    }
    next(error);
  }
}

// POST /api/foyer/join
export async function joinFoyerController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    if (!code) {
      return res.status(400).json({ message: 'Le code d’invitation est requis.' });
    }

    const updatedUser = await joinFoyer(userId, code);

    const foyerMembers = await prisma.user.findMany({
      where: { foyerId: updatedUser.foyer?.id },
      select: { pushToken: true },
    });

    const pushTokens = foyerMembers
      .map((member) => member.pushToken)
      .filter((token): token is string => Boolean(token));

    for (const token of pushTokens) {
      await sendPushNotification(
        token,
        `${updatedUser.name} a rejoint votre foyer "${updatedUser.foyer?.name}".`
      );
    }

    return res.status(200).json({
      message: 'Foyer rejoint avec succès',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        foyer: {
          id: updatedUser.foyer?.id,
          name: updatedUser.foyer?.name,
          code: updatedUser.foyer?.code,
          rule: updatedUser.foyer?.rule,
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[joinFoyerController] Erreur :', error.message);
      return res.status(500).json({ message: 'Erreur interne', error: error.message });
    }
    next(error);
  }
}
