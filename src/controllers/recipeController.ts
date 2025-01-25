import { Request, Response, NextFunction } from 'express';
import {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  voteForRecipe,
} from '../services/recipeService';
import { prisma } from '../config/db';
import { sendPushNotification } from '../utils/notifications';

/**
 * Création d'une nouvelle recette
 */
export async function createRecipeController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { foyerId: true } });
    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour proposer une recette.' });
    }

    const { title, description, ingredients, instructions } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Le titre de la recette est obligatoire.' });
    }

    const recipe = await createRecipe({
      title,
      description,
      ingredients,
      instructions,
      foyerId: user.foyerId,
      creatorId: userId,
    });

    const members = await prisma.user.findMany({
      where: { foyerId: user.foyerId },
      select: { pushToken: true },
    });

    const pushTokens = members
      .map((member) => member.pushToken)
      .filter((token): token is string => Boolean(token));

    for (const token of pushTokens) {
      await sendPushNotification(token, `Nouvelle recette : "${title}" a été ajoutée dans votre foyer !`);
    }

    return res.status(201).json({
      message: 'Recette créée avec succès.',
      recipe,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Suppression d'une recette
 */
export async function deleteRecipeController(req: Request, res: Response, next: NextFunction) {
  try {
    const recipeId = req.params.recipeId;

    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { title: true, foyerId: true } });
    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable ou déjà supprimée.' });
    }

    const deleted = await deleteRecipe(recipeId);

    const members = await prisma.user.findMany({
      where: { foyerId: recipe.foyerId },
      select: { pushToken: true },
    });

    const pushTokens = members
      .map((member) => member.pushToken)
      .filter((token): token is string => Boolean(token));

    for (const token of pushTokens) {
      await sendPushNotification(token, `La recette "${recipe.title}" a été supprimée.`);
    }

    return res.status(200).json({
      message: 'Recette supprimée.',
      recipe: deleted,
    });
  } catch (error) {
    next(error);
  }
}

// Ajout des fonctions manquantes
export async function getAllRecipesController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
    }

    const sortByVotes = req.query.sortByVotes === 'true';
    const recipes = await getAllRecipes(user.foyerId, sortByVotes);
    return res.status(200).json(recipes);
  } catch (error) {
    next(error);
  }
}

export async function getRecipeByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const recipeId = req.params.recipeId;
    const recipe = await getRecipeById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }
    return res.status(200).json(recipe);
  } catch (error) {
    next(error);
  }
}

export async function updateRecipeController(req: Request, res: Response, next: NextFunction) {
  try {
    const recipeId = req.params.recipeId;
    const { title, description, ingredients, instructions } = req.body;

    const updated = await updateRecipe({
      recipeId,
      title,
      description,
      ingredients,
      instructions,
    });

    return res.status(200).json({
      message: 'Recette mise à jour.',
      recipe: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function voteForRecipeController(req: Request, res: Response, next: NextFunction) {
  try {
    const recipeId = req.params.recipeId;
    const updated = await voteForRecipe(recipeId);
    return res.status(200).json({
      message: 'Vote enregistré.',
      recipe: updated,
    });
  } catch (error) {
    next(error);
  }
}
