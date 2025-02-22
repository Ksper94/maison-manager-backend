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
// GET /api/foyer/me (profil de l'utilisateur connecté)
router.get('/me', authMiddleware_1.authMiddleware, foyerController_1.getUserProfileController);
// GET /api/foyer/user-foyers (liste des foyers)
router.get('/user-foyers', authMiddleware_1.authMiddleware, foyerController_1.getUserFoyersController);
exports.default = router;
