import { Request, Response, NextFunction } from 'express';
import { createFoyer, joinFoyer } from '../services/foyerService';
import { sendPushNotification } from '../utils/notifications';
import { prisma } from '../config/db'; // Import de Prisma

// POST /api/foyer/create
export async function createFoyerController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const { name, rule } = req.body;

    if (!name || !rule) {
      return res.status(400).json({ message: 'Champs name et rule obligatoires' });
    }

    // Création du foyer
    const updatedUser = await createFoyer(userId, name, rule);

    // Envoi de notification push au créateur (optionnel)
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
  } catch (error) {
    next(error);
  }
}

// POST /api/foyer/join
export async function joinFoyerController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code d’invitation requis' });
    }

    // Rejoindre un foyer
    const updatedUser = await joinFoyer(userId, code);

    // Notification aux membres du foyer existant
    const foyerMembers = await prisma.user.findMany({
      where: { foyerId: updatedUser.foyer?.id },
      select: { pushToken: true },
    });

    // Correction du typage
    const pushTokens = foyerMembers
      .map((member: { pushToken: string | null }) => member.pushToken)
      .filter((token): token is string => Boolean(token)); // Filtre les tokens valides

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
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
}
