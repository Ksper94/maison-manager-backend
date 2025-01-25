"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTravelIdeaController = createTravelIdeaController;
exports.getAllTravelIdeasController = getAllTravelIdeasController;
exports.getTravelIdeaByIdController = getTravelIdeaByIdController;
exports.updateTravelIdeaController = updateTravelIdeaController;
exports.deleteTravelIdeaController = deleteTravelIdeaController;
exports.voteForTravelIdeaController = voteForTravelIdeaController;
const travelService_1 = require("../services/travelService");
const db_1 = require("../config/db");
async function createTravelIdeaController(req, res, next) {
    try {
        const userId = req.userId;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour proposer une idée de voyage.' });
        }
        const { title, description, location } = req.body;
        const idea = await (0, travelService_1.createTravelIdea)({
            title,
            description,
            location,
            foyerId: user.foyerId,
            creatorId: userId
        });
        return res.status(201).json({
            message: 'Idée de voyage créée avec succès.',
            idea
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAllTravelIdeasController(req, res, next) {
    try {
        const userId = req.userId;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.foyerId) {
            return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
        }
        // ?sortByVotes=true pour trier par votes
        const sortByVotes = req.query.sortByVotes === 'true';
        const ideas = await (0, travelService_1.getAllTravelIdeas)(user.foyerId, sortByVotes);
        return res.status(200).json(ideas);
    }
    catch (error) {
        next(error);
    }
}
async function getTravelIdeaByIdController(req, res, next) {
    try {
        const ideaId = req.params.ideaId;
        const idea = await (0, travelService_1.getTravelIdeaById)(ideaId);
        if (!idea) {
            return res.status(404).json({ message: 'Idée introuvable.' });
        }
        return res.status(200).json(idea);
    }
    catch (error) {
        next(error);
    }
}
async function updateTravelIdeaController(req, res, next) {
    try {
        const ideaId = req.params.ideaId;
        const { title, description, location } = req.body;
        const updated = await (0, travelService_1.updateTravelIdea)({ ideaId, title, description, location });
        return res.status(200).json({
            message: 'Idée de voyage mise à jour.',
            idea: updated
        });
    }
    catch (error) {
        next(error);
    }
}
async function deleteTravelIdeaController(req, res, next) {
    try {
        const ideaId = req.params.ideaId;
        const deleted = await (0, travelService_1.deleteTravelIdea)(ideaId);
        return res.status(200).json({
            message: 'Idée de voyage supprimée.',
            idea: deleted
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Gère le vote / like
 */
async function voteForTravelIdeaController(req, res, next) {
    try {
        const ideaId = req.params.ideaId;
        // On pourrait vérifier que l'utilisateur fait partie du foyer, etc.
        const updated = await (0, travelService_1.voteForTravelIdea)(ideaId);
        return res.status(200).json({
            message: 'Vote enregistré.',
            idea: updated
        });
    }
    catch (error) {
        next(error);
    }
}
