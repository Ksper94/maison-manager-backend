"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShoppingItem = createShoppingItem;
exports.getAllShoppingItems = getAllShoppingItems;
exports.getShoppingItemById = getShoppingItemById;
exports.updateShoppingItem = updateShoppingItem;
exports.deleteShoppingItem = deleteShoppingItem;
const db_1 = require("../config/db");
/**
 * Créer un nouvel article de la liste de courses pour un foyer.
 */
async function createShoppingItem(data) {
    const { name, quantity, foyerId, assignedToId, addedById } = data;
    if (!name.trim()) {
        throw new Error('Le nom de l’article est obligatoire.');
    }
    if (quantity && (isNaN(Number(quantity)) || Number(quantity) <= 0)) {
        throw new Error('La quantité doit être un nombre valide supérieur à 0.');
    }
    return db_1.prisma.shoppingItem.create({
        data: {
            name: name.trim(),
            quantity: quantity?.trim(),
            foyerId,
            assignedToId,
            addedById,
        },
    });
}
/**
 * Récupérer tous les articles d’un foyer,
 * éventuellement filtrés par "purchased".
 */
async function getAllShoppingItems(foyerId, purchased) {
    const whereClause = { foyerId };
    if (typeof purchased === 'boolean') {
        whereClause.purchased = purchased;
    }
    return db_1.prisma.shoppingItem.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            addedBy: { select: { id: true, name: true, email: true } },
        },
    });
}
/**
 * Récupérer un article spécifique par ID,
 * en incluant qui l’a ajouté et à qui il est assigné.
 */
async function getShoppingItemById(itemId) {
    return db_1.prisma.shoppingItem.findUnique({
        where: { id: itemId },
        include: {
            assignedTo: true,
            addedBy: true,
        },
    });
}
/**
 * Mettre à jour un article de la liste de courses.
 */
async function updateShoppingItem(data) {
    const { itemId, name, quantity, purchased, assignedToId } = data;
    if (quantity && (isNaN(Number(quantity)) || Number(quantity) <= 0)) {
        throw new Error('La quantité doit être un nombre valide supérieur à 0.');
    }
    return db_1.prisma.shoppingItem.update({
        where: { id: itemId },
        data: {
            name: name?.trim(),
            quantity: quantity?.trim(),
            purchased,
            assignedToId,
        },
    });
}
/**
 * Supprime un article par ID.
 */
async function deleteShoppingItem(itemId) {
    return db_1.prisma.shoppingItem.delete({ where: { id: itemId } });
}
