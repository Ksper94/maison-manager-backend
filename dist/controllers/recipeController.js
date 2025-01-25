"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecipeController = createRecipeController;
exports.getAllRecipesController = getAllRecipesController;
exports.getRecipeByIdController = getRecipeByIdController;
exports.updateRecipeController = updateRecipeController;
exports.deleteRecipeController = deleteRecipeController;
exports.voteForRecipeController = voteForRecipeController;
const recipeService_1 = require("../services/recipeService");
const db_1 = require("../config/db");
async function createRecipeController(req, res, next) {
    try {
        const userId = req.userId;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour proposer une recette.' });
        }
        const { title, description, ingredients, instructions } = req.body;
        const recipe = await (0, recipeService_1.createRecipe)({
            title,
            description,
            ingredients,
            instructions,
            foyerId: user.foyerId,
            creatorId: userId
        });
        return res.status(201).json({
            message: 'Recette créée avec succès.',
            recipe
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAllRecipesController(req, res, next) {
    try {
        const userId = req.userId;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
        }
        // Tri par votes si ?sortByVotes=true
        const sortByVotes = req.query.sortByVotes === 'true';
        const recipes = await (0, recipeService_1.getAllRecipes)(user.foyerId, sortByVotes);
        return res.status(200).json(recipes);
    }
    catch (error) {
        next(error);
    }
}
async function getRecipeByIdController(req, res, next) {
    try {
        const recipeId = req.params.recipeId;
        const recipe = await (0, recipeService_1.getRecipeById)(recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recette introuvable.' });
        }
        return res.status(200).json(recipe);
    }
    catch (error) {
        next(error);
    }
}
async function updateRecipeController(req, res, next) {
    try {
        const recipeId = req.params.recipeId;
        const { title, description, ingredients, instructions } = req.body;
        const updated = await (0, recipeService_1.updateRecipe)({
            recipeId,
            title,
            description,
            ingredients,
            instructions
        });
        return res.status(200).json({
            message: 'Recette mise à jour.',
            recipe: updated
        });
    }
    catch (error) {
        next(error);
    }
}
async function deleteRecipeController(req, res, next) {
    try {
        const recipeId = req.params.recipeId;
        const deleted = await (0, recipeService_1.deleteRecipe)(recipeId);
        return res.status(200).json({
            message: 'Recette supprimée.',
            recipe: deleted
        });
    }
    catch (error) {
        next(error);
    }
}
async function voteForRecipeController(req, res, next) {
    try {
        const recipeId = req.params.recipeId;
        const updated = await (0, recipeService_1.voteForRecipe)(recipeId);
        return res.status(200).json({
            message: 'Vote enregistré.',
            recipe: updated
        });
    }
    catch (error) {
        next(error);
    }
}
