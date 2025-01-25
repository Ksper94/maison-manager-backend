"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/travelRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const travelController_1 = require("../controllers/travelController");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.createTravelIdeaController);
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.getAllTravelIdeasController);
router.get('/:ideaId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.getTravelIdeaByIdController);
router.patch('/:ideaId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.updateTravelIdeaController);
router.delete('/:ideaId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.deleteTravelIdeaController);
// Endpoint pour voter
router.post('/:ideaId/vote', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, travelController_1.voteForTravelIdeaController);
exports.default = router;
