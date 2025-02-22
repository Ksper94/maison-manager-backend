"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post('/register', authController_1.register);
// POST /api/auth/login
router.post('/login', authController_1.login);
// GET /api/auth/me - Récupérer le profil utilisateur
router.get('/me', authMiddleware_1.authMiddleware, authController_1.getUserProfile);
// PUT /api/auth/me - Mettre à jour le profil utilisateur
router.put('/me', authMiddleware_1.authMiddleware, authController_1.updateUserProfile);
// POST /api/auth/refresh - Rafraîchir l'access token
router.post('/refresh', authController_1.refreshAccessToken);
exports.default = router;
