"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShoppingItem = createShoppingItem;
exports.getAllShoppingItems = getAllShoppingItems;
exports.getShoppingItemById = getShoppingItemById;
exports.updateShoppingItem = updateShoppingItem;
exports.deleteShoppingItem = deleteShoppingItem;
const db_1 = require("../config/db");
async function createShoppingItem(data) {
    const { name, quantity, foyerId, assignedToId, addedById } = data;
    if (!name) {
        throw new Error('Le nom de l’article est obligatoire.');
    }
    const newItem = await db_1.prisma.shoppingItem.create({
        data: {
            name,
            quantity,
            foyerId,
            assignedToId,
            addedById
        }
    });
    return newItem;
}
async function getAllShoppingItems(foyerId, purchased) {
    const whereClause = { foyerId };
    if (typeof purchased === 'boolean') {
        whereClause.purchased = purchased;
    }
    const items = await db_1.prisma.shoppingItem.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
            assignedTo: {
                select: { id: true, name: true, email: true }
            },
            addedBy: {
                select: { id: true, name: true, email: true }
            }
        }
    });
    return items;
}
async function getShoppingItemById(itemId) {
    const item = await db_1.prisma.shoppingItem.findUnique({
        where: { id: itemId },
        include: {
            assignedTo: true,
            addedBy: true
        }
    });
    return item;
}
async function updateShoppingItem(data) {
    const { itemId, name, quantity, purchased, assignedToId } = data;
    const existingItem = await db_1.prisma.shoppingItem.findUnique({
        where: { id: itemId },
        include: {
            assignedTo: true
        }
    });
    if (!existingItem) {
        throw new Error('Article introuvable.');
    }
    const wasPurchased = existingItem.purchased;
    const updated = await db_1.prisma.shoppingItem.update({
        where: { id: itemId },
        data: {
            name,
            quantity,
            purchased,
            assignedToId
        },
        include: {
            assignedTo: true
        }
    });
    // Système de points : si l'article est maintenant purchased=true et que ça ne l'était pas avant
    if (purchased === true && !wasPurchased) {
        // On attribue des points à l'utilisateur qui a acheté l'article
        // (ici, on suppose "assignedTo" est celui qui l'a acheté).
        if (updated.assignedTo) {
            // Ex: +5 points par article acheté
            await db_1.prisma.user.update({
                where: { id: updated.assignedTo.id },
                data: {
                    points: { increment: 5 }
                }
            });
        }
    }
    return updated;
}
async function deleteShoppingItem(itemId) {
    // vérifier si l'item existe
    const existingItem = await db_1.prisma.shoppingItem.findUnique({ where: { id: itemId } });
    if (!existingItem) {
        throw new Error('Article introuvable ou déjà supprimé.');
    }
    const deleted = await db_1.prisma.shoppingItem.delete({
        where: { id: itemId }
    });
    return deleted;
}
