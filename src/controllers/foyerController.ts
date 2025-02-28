import { Request, Response, NextFunction } from 'express';
import { getUserProfile, getUserFoyers } from '../services/userService';
import { createFoyer, joinFoyer, updateFoyerRules } from '../services/foyerService';

/**
 * Controller pour récupérer le profil de l'utilisateur connecté.
 */
export const getUserProfileController = async (req: Request, res: Response, next: NextFunction) => {
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
    console.error('[getUserProfileController] Erreur :', error);
    next(error);
  }
};

/**
 * Controller pour récupérer les foyers de l'utilisateur
 */
export const getUserFoyersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as any;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const foyers = await getUserFoyers(userId);

    if (!foyers || foyers.length === 0) {
      return res.status(404).json({ message: 'Aucun foyer trouvé' });
    }

    return res.status(200).json({ foyers });
  } catch (error) {
    console.error('[getUserFoyersController] Erreur :', error);
    next(error);
  }
};

/**
 * Controller pour créer un foyer
 */
export const createFoyerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as any;
    const { name, rule } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    if (!name || !rule) {
      return res.status(400).json({ message: 'Le nom et les règles du foyer sont requis' });
    }

    const updatedUser = await createFoyer(userId, name, rule);

    return res.status(201).json({
      message: 'Foyer créé avec succès',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[createFoyerController] Erreur :', error);
    next(error);
  }
};

/**
 * Controller pour rejoindre un foyer
 */
export const joinFoyerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as any;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    if (!code) {
      return res.status(400).json({ message: 'Le code du foyer est requis' });
    }

    const updatedUser = await joinFoyer(userId, code);

    return res.status(200).json({
      message: 'Foyer rejoint avec succès',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[joinFoyerController] Erreur :', error);
    next(error);
  }
};

/**
 * Controller pour mettre à jour les règles d'un foyer
 */
export const updateFoyerRulesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as any;
    const { foyerId } = req.params; // Récupère l'ID du foyer depuis les paramètres de la route
    const { rules } = req.body;    // Récupère les nouvelles règles depuis le corps de la requête

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    if (!foyerId || !rules) {
      return res.status(400).json({ message: 'L\'ID du foyer et les règles sont requis' });
    }

    const updatedUser = await updateFoyerRules(foyerId, rules);

    return res.status(200).json({
      message: 'Règles mises à jour avec succès',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[updateFoyerRulesController] Erreur :', error);
    next(error);
  }
};