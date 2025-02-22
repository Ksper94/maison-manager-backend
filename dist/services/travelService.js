"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTravelIdea = createTravelIdea;
exports.getAllTravelIdeas = getAllTravelIdeas;
exports.getTravelIdeaById = getTravelIdeaById;
exports.updateTravelIdea = updateTravelIdea;
exports.deleteTravelIdea = deleteTravelIdea;
exports.voteForTravelIdea = voteForTravelIdea;
const db_1 = require("../config/db");
/**
 * Crée une nouvelle idée de voyage pour un foyer.
 */
async function createTravelIdea(data) {
    const { title, description, location, foyerId, creatorId } = data;
    if (!title) {
        throw new Error('Le titre de l’idée de voyage est obligatoire.');
    }
    // Création en base
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
 * Récupère toutes les idées de voyage d'un foyer,
 * avec possibilité de trier par nombre de votes.
 */
async function getAllTravelIdeas(foyerId, sortByVotes) {
    // On choisit l'ordre de tri
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
 * Récupère une idée de voyage précise par ID.
 */
async function getTravelIdeaById(ideaId) {
    const idea = await db_1.prisma.travelIdea.findUnique({
        where: { id: ideaId },
        include: {
            creator: true, // Inclure toutes les infos du créateur
        },
    });
    return idea;
}
async function updateTravelIdea(data) {
    const { ideaId, title, description, location } = data;
    // Vérifie l'existence
    const existing = await db_1.prisma.travelIdea.findUnique({
        where: { id: ideaId },
    });
    if (!existing) {
        throw new Error('Idée de voyage introuvable.');
    }
    // Mise à jour
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
 * Supprime une idée de voyage par ID.
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
 * Incrémente de 1 le champ `votes` de l’idée de voyage.
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
            votes: { increment: 1 },
        },
    });
    return updated;
}
