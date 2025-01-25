"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const foyerController_1 = require("../controllers/foyerController");
const router = (0, express_1.Router)();
// POST /api/foyer/create
router.post('/create', authMiddleware_1.authMiddleware, foyerController_1.createFoyerController);
// POST /api/foyer/join
router.post('/join', authMiddleware_1.authMiddleware, foyerController_1.joinFoyerController);
exports.default = router;
