"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShoppingItemController = createShoppingItemController;
exports.getShoppingItemsController = getShoppingItemsController;
exports.getShoppingItemByIdController = getShoppingItemByIdController;
exports.updateShoppingItemController = updateShoppingItemController;
exports.deleteShoppingItemController = deleteShoppingItemController;
const shoppingService_1 = require("../services/shoppingService");
const db_1 = require("../config/db");
const notifications_1 = require("../utils/notifications");
/**
 * Récupère le premier foyerId trouvé pour un user dans la table pivot UserFoyer.
 */
async function getUserFoyerId(userId) {
    const userFoyerRecord = await db_1.prisma.userFoyer.findFirst({
        where: { userId },
    });
    return userFoyerRecord?.foyerId || null;
}
/**
 * Récupère tous les pushTokens des membres d'un foyer, via la table pivot.
 */
async function getFoyerMembersPushTokens(foyerId) {
    const userFoyerRecords = await db_1.prisma.userFoyer.findMany({
        where: { foyerId },
        include: {
            user: {
                select: { pushToken: true, name: true },
            },
        },
    });
    return userFoyerRecords
        .map((uf) => uf.user?.pushToken)
        .filter((token) => Boolean(token));
}
/**
 * Création d'un article dans la liste de courses
 */
async function createShoppingItemController(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        // On récupère le foyerId du user (premier foyer trouvé)
        const foyerId = await getUserFoyerId(userId);
        if (!foyerId) {
            return res
                .status(403)
                .json({ message: 'Vous devez appartenir à un foyer pour ajouter un article.' });
        }
        const { name, quantity, assignedToId } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Le champ 'name' est obligatoire." });
        }
        // Création de l'article via la couche service
        const item = await (0, shoppingService_1.createShoppingItem)({
            name,
            quantity: quantity || '1', // Par défaut, quantité = 1
            foyerId,
            assignedToId,
            addedById: userId,
        });
        // Pour la notification, on veut également le nom du user qui a ajouté
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });
        const userName = user?.name || 'Quelqu\'un';
        // Récupérer les tokens des membres du foyer
        const pushTokens = await getFoyerMembersPushTokens(foyerId);
        for (const token of pushTokens) {
            await (0, notifications_1.sendPushNotification)(token, `${userName} a ajouté "${name}" à la liste de courses.`);
        }
        return res.status(201).json({ message: 'Article ajouté avec succès.', item });
    }
    catch (error) {
        console.error('[createShoppingItemController] Erreur :', error);
        next(error);
    }
}
/**
 * Récupération de tous les articles de la liste de courses
 */
async function getShoppingItemsController(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        // On récupère le foyerId
        const foyerId = await getUserFoyerId(userId);
        if (!foyerId) {
            return res
                .status(403)
                .json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
        }
        // Gestion du filtre "purchased"
        const purchasedQuery = req.query.purchased;
        const purchased = purchasedQuery === 'true'
            ? true
            : purchasedQuery === 'false'
                ? false
                : undefined;
        // Récupère les items via la couche service
        const items = await (0, shoppingService_1.getAllShoppingItems)(foyerId, purchased);
        console.log('[getShoppingItemsController] Articles trouvés :', items);
        return res.status(200).json(items);
    }
    catch (error) {
        console.error('[getShoppingItemsController] Erreur :', error);
        next(error);
    }
}
/**
 * Récupération d'un article spécifique par ID
 */
async function getShoppingItemByIdController(req, res, next) {
    try {
        const itemId = req.params.itemId;
        const item = await (0, shoppingService_1.getShoppingItemById)(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Article introuvable.' });
        }
        return res.status(200).json(item);
    }
    catch (error) {
        console.error('[getShoppingItemByIdController] Erreur :', error);
        next(error);
    }
}
/**
 * Mise à jour d'un article
 */
async function updateShoppingItemController(req, res, next) {
    try {
        const itemId = req.params.itemId;
        const { name, quantity, purchased, assignedToId } = req.body;
        const updatedItem = await (0, shoppingService_1.updateShoppingItem)({
            itemId,
            name,
            quantity,
            purchased,
            assignedToId,
        });
        return res
            .status(200)
            .json({ message: 'Article mis à jour avec succès.', item: updatedItem });
    }
    catch (error) {
        console.error('[updateShoppingItemController] Erreur :', error);
        next(error);
    }
}
/**
 * Suppression d'un article
 */
async function deleteShoppingItemController(req, res, next) {
    try {
        const itemId = req.params.itemId;
        const deletedItem = await (0, shoppingService_1.deleteShoppingItem)(itemId);
        if (!deletedItem) {
            return res
                .status(404)
                .json({ message: 'Article introuvable ou déjà supprimé.' });
        }
        return res
            .status(200)
            .json({ message: 'Article supprimé avec succès.', item: deletedItem });
    }
    catch (error) {
        console.error('[deleteShoppingItemController] Erreur :', error);
        next(error);
    }
}
