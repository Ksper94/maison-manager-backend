"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/shoppingRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const shoppingController_1 = require("../controllers/shoppingController");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, shoppingController_1.createShoppingItemController);
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, shoppingController_1.getShoppingItemsController);
router.get('/:itemId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, shoppingController_1.getShoppingItemByIdController);
router.patch('/:itemId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, shoppingController_1.updateShoppingItemController);
router.delete('/:itemId', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, shoppingController_1.deleteShoppingItemController);
exports.default = router;
