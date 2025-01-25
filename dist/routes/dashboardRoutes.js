"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/dashboardRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const router = (0, express_1.Router)();
// GET /api/dashboard/
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, (req, res) => {
    return res.json({ message: 'Bienvenue sur le dashboard !' });
});
// Tu peux ajouter d’autres endpoints liés au dashboard ici
// router.get('/something', ...)
exports.default = router;
