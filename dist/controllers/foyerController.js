"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinFoyerController = exports.createFoyerController = exports.getUserFoyersController = exports.getUserProfileController = void 0;
const userService_1 = require("../services/userService");
const foyerService_1 = require("../services/foyerService");
/**
 * Controller pour récupérer le profil de l'utilisateur connecté.
 */
const getUserProfileController = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise' });
        }
        const userProfile = await (0, userService_1.getUserProfile)(userId);
        if (!userProfile) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        return res.status(200).json({ user: userProfile });
    }
    catch (error) {
        console.error('[getUserProfileController] Erreur :', error);
        next(error);
    }
};
exports.getUserProfileController = getUserProfileController;
/**
 * Controller pour récupérer les foyers de l'utilisateur
 */
const getUserFoyersController = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise' });
        }
        const foyers = await (0, userService_1.getUserFoyers)(userId);
        if (!foyers || foyers.length === 0) {
            return res.status(404).json({ message: 'Aucun foyer trouvé' });
        }
        return res.status(200).json({ foyers });
    }
    catch (error) {
        console.error('[getUserFoyersController] Erreur :', error);
        next(error);
    }
};
exports.getUserFoyersController = getUserFoyersController;
/**
 * Controller pour créer un foyer
 */
const createFoyerController = async (req, res, next) => {
    try {
        const { userId } = req;
        const { name, rule } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise' });
        }
        if (!name || !rule) {
            return res.status(400).json({ message: 'Le nom et les règles du foyer sont requis' });
        }
        const updatedUser = await (0, foyerService_1.createFoyer)(userId, name, rule);
        return res.status(201).json({
            message: 'Foyer créé avec succès',
            user: updatedUser,
        });
    }
    catch (error) {
        console.error('[createFoyerController] Erreur :', error);
        next(error);
    }
};
exports.createFoyerController = createFoyerController;
/**
 * Controller pour rejoindre un foyer
 */
const joinFoyerController = async (req, res, next) => {
    try {
        const { userId } = req;
        const { code } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise' });
        }
        if (!code) {
            return res.status(400).json({ message: 'Le code du foyer est requis' });
        }
        const updatedUser = await (0, foyerService_1.joinFoyer)(userId, code);
        return res.status(200).json({
            message: 'Foyer rejoint avec succès',
            user: updatedUser,
        });
    }
    catch (error) {
        console.error('[joinFoyerController] Erreur :', error);
        next(error);
    }
};
exports.joinFoyerController = joinFoyerController;
