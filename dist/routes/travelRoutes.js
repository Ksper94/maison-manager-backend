"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const travelController_1 = require("../controllers/travelController");
const router = (0, express_1.Router)();
// Créer une idée de voyage
router.post('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.createTravelIdeaController);
// Récupérer toutes les idées de voyage
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.getAllTravelIdeasController);
// Récupérer une idée de voyage par ID
router.get('/:ideaId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.getTravelIdeaByIdController);
// Mettre à jour une idée de voyage
router.patch('/:ideaId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.updateTravelIdeaController);
// Supprimer une idée de voyage
router.delete('/:ideaId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.deleteTravelIdeaController);
// Voter pour une idée de voyage
router.post('/:ideaId/vote', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.voteForTravelIdeaController);
exports.default = router;
