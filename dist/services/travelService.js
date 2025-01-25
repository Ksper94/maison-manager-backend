"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTravelIdea = createTravelIdea;
exports.getAllTravelIdeas = getAllTravelIdeas;
exports.getTravelIdeaById = getTravelIdeaById;
exports.updateTravelIdea = updateTravelIdea;
exports.deleteTravelIdea = deleteTravelIdea;
exports.voteForTravelIdea = voteForTravelIdea;
// src/services/travelService.ts
const db_1 = require("../config/db");
async function createTravelIdea(data) {
    const { title, description, location, foyerId, creatorId } = data;
    if (!title) {
        throw new Error('Le titre de l’idée de voyage est obligatoire.');
    }
    const newIdea = await db_1.prisma.travelIdea.create({
        data: {
            title,
            description,
            location,
            foyerId,
            creatorId,
        },
    });
    return newIdea;
}
/**
 * Récupère toutes les idées de voyage d'un foyer.
 * Possibilité de trier par votes descendants.
 */
async function getAllTravelIdeas(foyerId, sortByVotes) {
    // Ajout de "as const" pour que TypeScript reconnaisse la valeur littérale 'desc'
    const orderByClause = sortByVotes
        ? { votes: 'desc' }
        : { createdAt: 'desc' };
    const ideas = await db_1.prisma.travelIdea.findMany({
        where: { foyerId },
        orderBy: orderByClause,
        include: {
            creator: {
                select: { id: true, name: true },
            },
        },
    });
    return ideas;
}
/**
 * Récupère une idée de voyage précise
 */
async function getTravelIdeaById(ideaId) {
    const idea = await db_1.prisma.travelIdea.findUnique({
        where: { id: ideaId },
        include: {
            creator: true,
        },
    });
    return idea;
}
async function updateTravelIdea(data) {
    const { ideaId, title, description, location } = data;
    const existing = await db_1.prisma.travelIdea.findUnique({
        where: { id: ideaId },
    });
    if (!existing) {
        throw new Error('Idée de voyage introuvable.');
    }
    const updated = await db_1.prisma.travelIdea.update({
        where: { id: ideaId },
        data: {
            title,
            description,
            location,
        },
    });
    return updated;
}
/**
 * Supprime une idée de voyage.
 */
async function deleteTravelIdea(ideaId) {
    const existing = await db_1.prisma.travelIdea.findUnique({
        where: { id: ideaId },
    });
    if (!existing) {
        throw new Error('Idée de voyage introuvable ou déjà supprimée.');
    }
    const deleted = await db_1.prisma.travelIdea.delete({
        where: { id: ideaId },
    });
    return deleted;
}
/**
 * Vote (like) pour l'idée (incrementer `votes`).
 */
async function voteForTravelIdea(ideaId) {
    const existing = await db_1.prisma.travelIdea.findUnique({
        where: { id: ideaId },
    });
    if (!existing) {
        throw new Error('Idée de voyage introuvable.');
    }
    const updated = await db_1.prisma.travelIdea.update({
        where: { id: ideaId },
        data: {
            votes: {
                increment: 1,
            },
        },
    });
    return updated;
}
