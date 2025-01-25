"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFoyerController = createFoyerController;
exports.joinFoyerController = joinFoyerController;
const foyerService_1 = require("../services/foyerService");
// POST /api/foyer/create
async function createFoyerController(req, res, next) {
    try {
        // On récupère le userId du token (authMiddleware)
        // cf. interface CustomRequest si besoin
        const userId = req.userId; // OU: (req as CustomRequest).userId
        const { name, rule } = req.body;
        if (!name || !rule) {
            return res.status(400).json({ message: 'Champs name et rule obligatoires' });
        }
        // Appel du service
        const updatedUser = await (0, foyerService_1.createFoyer)(userId, name, rule);
        return res.status(201).json({
            message: 'Foyer créé avec succès',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                foyer: {
                    id: updatedUser.foyer?.id,
                    name: updatedUser.foyer?.name,
                    code: updatedUser.foyer?.code,
                    rule: updatedUser.foyer?.rule
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
}
// POST /api/foyer/join
async function joinFoyerController(req, res, next) {
    try {
        const userId = req.userId;
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'Code d’invitation requis' });
        }
        const updatedUser = await (0, foyerService_1.joinFoyer)(userId, code);
        return res.status(200).json({
            message: 'Foyer rejoint avec succès',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                foyer: {
                    id: updatedUser.foyer?.id,
                    name: updatedUser.foyer?.name,
                    code: updatedUser.foyer?.code,
                    rule: updatedUser.foyer?.rule
                }
            }
        });
    }
    catch (error) {
        // Si on a lancé: `throw new Error("Foyer introuvable")` dans le service
        // on arrive ici
        return res.status(404).json({ message: error.message });
    }
}
