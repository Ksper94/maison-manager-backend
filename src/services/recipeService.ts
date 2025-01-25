// src/services/recipeService.ts
import { prisma } from '../config/db';

interface CreateRecipeInput {
  title: string;
  description?: string;
  ingredients?: string;
  instructions?: string;
  foyerId: string;
  creatorId?: string;
}

export async function createRecipe(data: CreateRecipeInput) {
  const { title, description, ingredients, instructions, foyerId, creatorId } = data;
  if (!title) {
    throw new Error('Le titre de la recette est obligatoire.');
  }

  const newRecipe = await prisma.recipe.create({
    data: {
      title,
      description,
      ingredients,
      instructions,
      foyerId,
      creatorId,
    },
  });
  return newRecipe;
}

export async function getAllRecipes(foyerId: string, sortByVotes = false) {
  // Ajout de "as const" pour que TypeScript reconnaisse la valeur littérale 'desc'
  const orderByClause = sortByVotes
    ? { votes: 'desc' as const }
    : { createdAt: 'desc' as const };

  const recipes = await prisma.recipe.findMany({
    where: { foyerId },
    orderBy: orderByClause,
    include: {
      creator: {
        select: { id: true, name: true },
      },
    },
  });
  return recipes;
}

export async function getRecipeById(recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      creator: true,
    },
  });
  return recipe;
}

interface UpdateRecipeInput {
  recipeId: string;
  title?: string;
  description?: string;
  ingredients?: string;
  instructions?: string;
}

export async function updateRecipe(data: UpdateRecipeInput) {
  const { recipeId, title, description, ingredients, instructions } = data;

  const existing = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });
  if (!existing) {
    throw new Error('Recette introuvable.');
  }

  const updated = await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      title,
      description,
      ingredients,
      instructions,
    },
  });
  return updated;
}

export async function deleteRecipe(recipeId: string) {
  const existing = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });
  if (!existing) {
    throw new Error('Recette introuvable ou déjà supprimée.');
  }

  const deleted = await prisma.recipe.delete({
    where: { id: recipeId },
  });
  return deleted;
}

/**
 * Vote (like) pour la recette : on incrémente le champ votes de +1.
 */
export async function voteForRecipe(recipeId: string) {
  const existing = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });
  if (!existing) {
    throw new Error('Recette introuvable.');
  }

  const updated = await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      votes: { increment: 1 },
    },
  });
  return updated;
}
