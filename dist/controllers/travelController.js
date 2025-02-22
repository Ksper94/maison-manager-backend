"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTravelIdeaController = createTravelIdeaController;
exports.getAllTravelIdeasController = getAllTravelIdeasController;
exports.getTravelIdeaByIdController = getTravelIdeaByIdController;
exports.updateTravelIdeaController = updateTravelIdeaController;
exports.deleteTravelIdeaController = deleteTravelIdeaController;
exports.voteForTravelIdeaController = voteForTravelIdeaController;
const db_1 = require("../config/db");
/**
 * Récupère l'enregistrement pivot UserFoyer pour un utilisateur,
 * incluant son foyerId. Retourne null si l'utilisateur n'appartient à aucun foyer.
 */
async function getUserPivot(userId) {
    if (!userId)
        return null;
    return db_1.prisma.userFoyer.findFirst({
        where: { userId },
    });
}
/**
 * Crée une nouvelle idée de voyage
 */
async function createTravelIdeaController(req, res, next) {
    try {
        const { title, description, location } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        const userPivot = await getUserPivot(userId);
        if (!userPivot) {
            return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour créer une idée de voyage.' });
        }
        if (!title) {
            return res.status(400).json({ message: 'Le titre de l\'idée de voyage est obligatoire.' });
        }
        const travelIdea = await db_1.prisma.travelIdea.create({
            data: {
                title,
                description,
                location,
                foyerId: userPivot.foyerId,
                creatorId: userId,
            },
        });
        return res.status(201).json({ message: 'Idée de voyage créée avec succès', travelIdea });
    }
    catch (error) {
        console.error('[createTravelIdeaController] Erreur :', error);
        next(error);
    }
}
/**
 * Récupère toutes les idées de voyage d'un foyer
 */
async function getAllTravelIdeasController(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        const userPivot = await getUserPivot(userId);
        if (!userPivot) {
            return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
        }
        const travelIdeas = await db_1.prisma.travelIdea.findMany({
            where: { foyerId: userPivot.foyerId },
        });
        return res.status(200).json(travelIdeas);
    }
    catch (error) {
        console.error('[getAllTravelIdeasController] Erreur :', error);
        next(error);
    }
}
/**
 * Récupère une idée de voyage par son ID
 */
async function getTravelIdeaByIdController(req, res, next) {
    try {
        const ideaId = req.params.ideaId;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        const userPivot = await getUserPivot(userId);
        if (!userPivot) {
            return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
        }
        const travelIdea = await db_1.prisma.travelIdea.findFirst({
            where: { id: ideaId, foyerId: userPivot.foyerId },
        });
        if (!travelIdea) {
            return res.status(404).json({ message: 'Idée de voyage introuvable.' });
        }
        return res.status(200).json(travelIdea);
    }
    catch (error) {
        console.error('[getTravelIdeaByIdController] Erreur :', error);
        next(error);
    }
}
/**
 * Met à jour une idée de voyage
 */
async function updateTravelIdeaController(req, res, next) {
    try {
        const ideaId = req.params.ideaId;
        const { title, description, location } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        const userPivot = await getUserPivot(userId);
        if (!userPivot) {
            return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
        }
        const travelIdea = await db_1.prisma.travelIdea.findFirst({
            where: { id: ideaId, foyerId: userPivot.foyerId },
        });
        if (!travelIdea) {
            return res.status(404).json({ message: 'Idée de voyage introuvable.' });
        }
        const updatedTravelIdea = await db_1.prisma.travelIdea.update({
            where: { id: ideaId },
            data: {
                title,
                description,
                location,
            },
        });
        return res.status(200).json({ message: 'Idée de voyage mise à jour.', travelIdea: updatedTravelIdea });
    }
    catch (error) {
        console.error('[updateTravelIdeaController] Erreur :', error);
        next(error);
    }
}
/**
 * Supprime une idée de voyage
 */
async function deleteTravelIdeaController(req, res, next) {
    try {
        const ideaId = req.params.ideaId;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        const userPivot = await getUserPivot(userId);
        if (!userPivot) {
            return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
        }
        const travelIdea = await db_1.prisma.travelIdea.findFirst({
            where: { id: ideaId, foyerId: userPivot.foyerId },
        });
        if (!travelIdea) {
            return res.status(404).json({ message: 'Idée de voyage introuvable ou déjà supprimée.' });
        }
        await db_1.prisma.travelIdea.delete({
            where: { id: ideaId },
        });
        return res.status(200).json({ message: 'Idée de voyage supprimée.' });
    }
    catch (error) {
        console.error('[deleteTravelIdeaController] Erreur :', error);
        next(error);
    }
}
/**
 * Vote pour une idée de voyage
 */
async function voteForTravelIdeaController(req, res, next) {
    try {
        const ideaId = req.params.ideaId;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }
        const userPivot = await getUserPivot(userId);
        if (!userPivot) {
            return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
        }
        const travelIdea = await db_1.prisma.travelIdea.findFirst({
            where: { id: ideaId, foyerId: userPivot.foyerId },
        });
        if (!travelIdea) {
            return res.status(404).json({ message: 'Idée de voyage introuvable.' });
        }
        // Vérifie si l'utilisateur a déjà voté
        const existingVote = await db_1.prisma.travelIdeaVote.findUnique({
            where: {
                travelIdeaId_userId: {
                    travelIdeaId: ideaId,
                    userId,
                },
            },
        });
        if (existingVote) {
            return res.status(400).json({ message: 'Vous avez déjà voté pour cette idée.' });
        }
        // Enregistre le vote
        await db_1.prisma.travelIdeaVote.create({
            data: {
                travelIdeaId: ideaId,
                userId,
            },
        });
        // Incrémente le compteur de votes
        await db_1.prisma.travelIdea.update({
            where: { id: ideaId },
            data: {
                votes: {
                    increment: 1,
                },
            },
        });
        return res.status(200).json({ message: 'Vote enregistré avec succès.' });
    }
    catch (error) {
        console.error('[voteForTravelIdeaController] Erreur :', error);
        next(error);
    }
}
