import { Request, Response, NextFunction } from 'express';
import { getUserProfile, getUserFoyers } from '../services/userService';
import { createFoyer, joinFoyer } from '../services/foyerService';

/**
 * Controller pour récupérer le profil de l'utilisateur connecté.
 */
export async function getUserProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req as any;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }
    const userProfile = await getUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    return res.status(200).json({ user: userProfile });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller pour récupérer les foyers de l'utilisateur
 */
export async function getUserFoyersController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req as any;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }
    const foyers = await getUserFoyers(userId);

    if (!foyers) {
      return res.status(404).json({ message: 'Aucun foyer trouvé' });
    }

    return res.status(200).json({ foyers });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller pour créer un foyer
 */
export async function createFoyerController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req as any;
    const { name, rule } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const updatedUser = await createFoyer(userId, name, rule);
    return res.status(201).json({
      message: 'Foyer créé avec succès',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller pour rejoindre un foyer
 */
export async function joinFoyerController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req as any;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const updatedUser = await joinFoyer(userId, code);
    return res.status(200).json({
      message: 'Foyer rejoint avec succès',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}
