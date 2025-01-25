"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShoppingItemController = createShoppingItemController;
exports.getShoppingItemsController = getShoppingItemsController;
exports.getShoppingItemByIdController = getShoppingItemByIdController;
exports.updateShoppingItemController = updateShoppingItemController;
exports.deleteShoppingItemController = deleteShoppingItemController;
const shoppingService_1 = require("../services/shoppingService");
const db_1 = require("../config/db");
async function createShoppingItemController(req, res, next) {
    try {
        const userId = req.userId;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour ajouter un article.' });
        }
        const { name, quantity, assignedToId } = req.body;
        const item = await (0, shoppingService_1.createShoppingItem)({
            name,
            quantity,
            foyerId: user.foyerId,
            assignedToId,
            addedById: userId
        });
        return res.status(201).json({
            message: 'Article ajouté à la liste de courses.',
            item
        });
    }
    catch (error) {
        next(error);
    }
}
async function getShoppingItemsController(req, res, next) {
    try {
        const userId = req.userId;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
        }
        // Filtre éventuel ?purchased=true/false
        const purchasedQuery = req.query.purchased;
        let purchased;
        if (purchasedQuery === 'true')
            purchased = true;
        if (purchasedQuery === 'false')
            purchased = false;
        const items = await (0, shoppingService_1.getAllShoppingItems)(user.foyerId, purchased);
        return res.status(200).json(items);
    }
    catch (error) {
        next(error);
    }
}
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
        next(error);
    }
}
async function updateShoppingItemController(req, res, next) {
    try {
        const itemId = req.params.itemId;
        const { name, quantity, purchased, assignedToId } = req.body;
        const updated = await (0, shoppingService_1.updateShoppingItem)({
            itemId,
            name,
            quantity,
            purchased,
            assignedToId
        });
        return res.status(200).json({
            message: 'Article mis à jour.',
            item: updated
        });
    }
    catch (error) {
        next(error);
    }
}
async function deleteShoppingItemController(req, res, next) {
    try {
        const itemId = req.params.itemId;
        const deleted = await (0, shoppingService_1.deleteShoppingItem)(itemId);
        return res.status(200).json({
            message: 'Article supprimé de la liste.',
            item: deleted
        });
    }
    catch (error) {
        next(error);
    }
}
