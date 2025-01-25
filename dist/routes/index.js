"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
// src/routes/index.ts
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const foyerRoutes_1 = __importDefault(require("./foyerRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
const calendarRoutes_1 = __importDefault(require("./calendarRoutes"));
const taskRoutes_1 = __importDefault(require("./taskRoutes"));
const shoppingRoutes_1 = __importDefault(require("./shoppingRoutes"));
const leaderboardRoutes_1 = __importDefault(require("./leaderboardRoutes"));
const travelRoutes_1 = __importDefault(require("./travelRoutes"));
const recipeRoutes_1 = __importDefault(require("./recipeRoutes"));
exports.router = (0, express_1.Router)();
exports.router.use('/auth', authRoutes_1.default);
exports.router.use('/foyer', foyerRoutes_1.default);
// Ici, on déclare que /dashboard pointe vers dashboardRoutes
exports.router.use('/dashboard', dashboardRoutes_1.default);
exports.router.use('/calendar', calendarRoutes_1.default);
exports.router.use('/tasks', taskRoutes_1.default);
exports.router.use('/shopping', shoppingRoutes_1.default);
exports.router.use('/leaderboard', leaderboardRoutes_1.default);
exports.router.use('/travel', travelRoutes_1.default);
exports.router.use('/recipes', recipeRoutes_1.default);
