"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecipe = createRecipe;
exports.getAllRecipes = getAllRecipes;
exports.getRecipeById = getRecipeById;
exports.updateRecipe = updateRecipe;
exports.deleteRecipe = deleteRecipe;
exports.voteForRecipe = voteForRecipe;
const db_1 = require("../config/db");
async function createRecipe(data) {
    const { title, description, ingredients, instructions, foyerId, creatorId } = data;
    if (!title) {
        throw new Error('Le titre de la recette est obligatoire.');
    }
    // Création en base de la recette
    const newRecipe = await db_1.prisma.recipe.create({
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
async function getAllRecipes(foyerId, sortByVotes = false) {
    // On définit l'ordre de tri
    const orderByClause = sortByVotes
        ? { votes: 'desc' }
        : { createdAt: 'desc' };
    const recipes = await db_1.prisma.recipe.findMany({
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
async function getRecipeById(recipeId) {
    const recipe = await db_1.prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
            creator: true,
        },
    });
    return recipe;
}
/**
 * Met à jour une recette existante.
 */
async function updateRecipe(data) {
    const { recipeId, title, description, ingredients, instructions } = data;
    // Vérifie l'existence de la recette
    const existing = await db_1.prisma.recipe.findUnique({
        where: { id: recipeId },
    });
    if (!existing) {
        throw new Error('Recette introuvable.');
    }
    // Mise à jour
    const updated = await db_1.prisma.recipe.update({
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
async function deleteRecipe(recipeId) {
    const existing = await db_1.prisma.recipe.findUnique({
        where: { id: recipeId },
    });
    if (!existing) {
        throw new Error('Recette introuvable ou déjà supprimée.');
    }
    const deleted = await db_1.prisma.recipe.delete({
        where: { id: recipeId },
    });
    return deleted;
}
/**
 * Incrémente de 1 le champ `votes` de la recette.
 */
async function voteForRecipe(recipeId) {
    const existing = await db_1.prisma.recipe.findUnique({
        where: { id: recipeId },
    });
    if (!existing) {
        throw new Error('Recette introuvable.');
    }
    const updated = await db_1.prisma.recipe.update({
        where: { id: recipeId },
        data: {
            votes: { increment: 1 },
        },
    });
    return updated;
}
