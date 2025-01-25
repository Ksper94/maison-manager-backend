"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecipe = createRecipe;
exports.getAllRecipes = getAllRecipes;
exports.getRecipeById = getRecipeById;
exports.updateRecipe = updateRecipe;
exports.deleteRecipe = deleteRecipe;
exports.voteForRecipe = voteForRecipe;
// src/services/recipeService.ts
const db_1 = require("../config/db");
async function createRecipe(data) {
    const { title, description, ingredients, instructions, foyerId, creatorId } = data;
    if (!title) {
        throw new Error('Le titre de la recette est obligatoire.');
    }
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
async function getAllRecipes(foyerId, sortByVotes = false) {
    // Ajout de "as const" pour que TypeScript reconnaisse la valeur littérale 'desc'
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
async function getRecipeById(recipeId) {
    const recipe = await db_1.prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
            creator: true,
        },
    });
    return recipe;
}
async function updateRecipe(data) {
    const { recipeId, title, description, ingredients, instructions } = data;
    const existing = await db_1.prisma.recipe.findUnique({
        where: { id: recipeId },
    });
    if (!existing) {
        throw new Error('Recette introuvable.');
    }
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
 * Vote (like) pour la recette : on incrémente le champ votes de +1.
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
