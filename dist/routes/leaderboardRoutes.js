"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/leaderboardRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const hasFoyerMiddleware_1 = require("../middlewares/hasFoyerMiddleware");
const leaderboardController_1 = require("../controllers/leaderboardController");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware, hasFoyerMiddleware_1.hasFoyerMiddleware, leaderboardController_1.getLeaderboardController);
exports.default = router;
