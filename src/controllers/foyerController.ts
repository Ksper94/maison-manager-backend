import { Request, Response, NextFunction } from 'express';
import { createFoyer, joinFoyer } from '../services/foyerService';

/**
 * Controller pour créer un foyer
 */
export async function createFoyerController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req as any; // Typage pour ajouter userId dans la requête
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
    const { userId } = req as any; // Typage pour ajouter userId dans la requête
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
