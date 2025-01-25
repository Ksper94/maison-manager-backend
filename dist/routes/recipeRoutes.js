"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const recipeController_1 = require("../controllers/recipeController");
const router = (0, express_1.Router)();
// POST /api/recipes
router.post('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, recipeController_1.createRecipeController);
// GET /api/recipes
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, recipeController_1.getAllRecipesController);
// GET /api/recipes/:recipeId
router.get('/:recipeId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, recipeController_1.getRecipeByIdController);
// PATCH /api/recipes/:recipeId
router.patch('/:recipeId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, recipeController_1.updateRecipeController);
// DELETE /api/recipes/:recipeId
router.delete('/:recipeId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, recipeController_1.deleteRecipeController);
// POST /api/recipes/:recipeId/vote
router.post('/:recipeId/vote', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, recipeController_1.voteForRecipeController);
exports.default = router;
