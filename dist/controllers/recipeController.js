"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecipeController = createRecipeController;
exports.deleteRecipeController = deleteRecipeController;
exports.getAllRecipesController = getAllRecipesController;
exports.getRecipeByIdController = getRecipeByIdController;
exports.updateRecipeController = updateRecipeController;
exports.voteForRecipeController = voteForRecipeController;
const recipeService_1 = require("../services/recipeService");
const db_1 = require("../config/db");
const notifications_1 = require("../utils/notifications");
/**
 * Récupère le premier foyerId trouvé pour un user (many-to-many).
 */
async function getUserFoyerId(userId) {
    const pivot = await db_1.prisma.userFoyer.findFirst({
        where: { userId },
    });
    return pivot?.foyerId || null;
}
/**
 * Récupère tous les membres (avec pushToken) d'un foyer via la table pivot.
 */
async function getFoyerMembersPushTokens(foyerId) {
    const userFoyerRecords = await db_1.prisma.userFoyer.findMany({
        where: { foyerId },
        include: {
            user: {
                select: { pushToken: true },
            },
        },
    });
    return userFoyerRecords
        .map((uf) => uf.user?.pushToken)
        .filter((token) => Boolean(token));
}
/**
 * 1) Création d'une nouvelle recette
 */
async function createRecipeController(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        // On récupère le foyerId via la table pivot
        const foyerId = await getUserFoyerId(userId);
        if (!foyerId) {
            return res
                .status(403)
                .json({ message: 'Vous devez appartenir à un foyer pour proposer une recette.' });
        }
        const { title, description, ingredients, instructions } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Le titre de la recette est obligatoire.' });
        }
        // Création de la recette (service Prisma)
        const recipe = await (0, recipeService_1.createRecipe)({
            title,
            description,
            ingredients,
            instructions,
            foyerId,
            creatorId: userId,
        });
        // Notifier les membres du foyer
        const pushTokens = await getFoyerMembersPushTokens(foyerId);
        for (const token of pushTokens) {
            await (0, notifications_1.sendPushNotification)(token, `Nouvelle recette : "${title}" a été ajoutée dans votre foyer !`);
        }
        return res.status(201).json({
            message: 'Recette créée avec succès.',
            recipe,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * 2) Suppression d'une recette
 */
async function deleteRecipeController(req, res, next) {
    try {
        const recipeId = req.params.recipeId;
        // On récupère la recette pour connaître son foyerId
        const recipe = await db_1.prisma.recipe.findUnique({
            where: { id: recipeId },
            select: { title: true, foyerId: true },
        });
        if (!recipe) {
            return res
                .status(404)
                .json({ message: 'Recette introuvable ou déjà supprimée.' });
        }
        // Suppression via le service
        const deleted = await (0, recipeService_1.deleteRecipe)(recipeId);
        // Notifier les membres du foyer
        const pushTokens = await getFoyerMembersPushTokens(recipe.foyerId);
        for (const token of pushTokens) {
            await (0, notifications_1.sendPushNotification)(token, `La recette "${recipe.title}" a été supprimée.`);
        }
        return res.status(200).json({
            message: 'Recette supprimée.',
            recipe: deleted,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * 3) Récupération de toutes les recettes du foyer de l'utilisateur
 */
async function getAllRecipesController(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        // Trouver le foyerId
        const foyerId = await getUserFoyerId(userId);
        if (!foyerId) {
            return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
        }
        const sortByVotes = req.query.sortByVotes === 'true';
        // Récupération de toutes les recettes via le service
        const recipes = await (0, recipeService_1.getAllRecipes)(foyerId, sortByVotes);
        return res.status(200).json(recipes);
    }
    catch (error) {
        next(error);
    }
}
/**
 * 4) Récupération d'une recette par ID
 */
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
/**
 * 5) Mise à jour d'une recette
 */
async function updateRecipeController(req, res, next) {
    try {
        const recipeId = req.params.recipeId;
        const { title, description, ingredients, instructions } = req.body;
        // Mise à jour via le service
        const updated = await (0, recipeService_1.updateRecipe)({
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
    }
    catch (error) {
        next(error);
    }
}
/**
 * 6) Vote pour une recette
 */
async function voteForRecipeController(req, res, next) {
    try {
        const recipeId = req.params.recipeId;
        // Vote via le service
        const updated = await (0, recipeService_1.voteForRecipe)(recipeId);
        return res.status(200).json({
            message: 'Vote enregistré.',
            recipe: updated,
        });
    }
    catch (error) {
        next(error);
    }
}
