import { prisma } from '../config/db';

interface CreateRecipeInput {
  title: string;
  description?: string;
  ingredients?: string;
  instructions?: string;
  foyerId: string;     // Chaque recette est liée à un foyer
  creatorId?: string;  // Optionnel : l'id de l'utilisateur qui crée la recette
}

export async function createRecipe(data: CreateRecipeInput) {
  const { title, description, ingredients, instructions, foyerId, creatorId } = data;
  if (!title) {
    throw new Error('Le titre de la recette est obligatoire.');
  }

  // Création en base de la recette
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

/**
 * Récupère toutes les recettes d’un foyer,
 * avec la possibilité de trier par nombre de votes.
 */
export async function getAllRecipes(foyerId: string, sortByVotes = false) {
  // On définit l'ordre de tri
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

/**
 * Récupère une recette par son ID,
 * en incluant son créateur si défini.
 */
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

/**
 * Met à jour une recette existante.
 */
export async function updateRecipe(data: UpdateRecipeInput) {
  const { recipeId, title, description, ingredients, instructions } = data;

  // Vérifie l'existence de la recette
  const existing = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });
  if (!existing) {
    throw new Error('Recette introuvable.');
  }

  // Mise à jour
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

/**
 * Supprime une recette par ID.
 */
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
 * Incrémente de 1 le champ `votes` de la recette.
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
