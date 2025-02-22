"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middlewares/errorHandler");
const routes_1 = require("./routes");
const foyerRoutes_1 = __importDefault(require("./routes/foyerRoutes"));
const app = (0, express_1.default)();
// Middlewares globaux
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// Middleware pour l'authentification (simplifié)
app.use((req, res, next) => {
    // Ici, vous pourriez vérifier le token JWT dans le header Authorization
    // et extraire l'userId pour l'ajouter à req
    // Pour l'instant, on simule l'ajout d'un userId
    req.userId = 'someUserId'; // Remplacez par la logique d'authentification réelle
    next();
});
// Routes principales
app.use('/api', routes_1.router);
// Routes spécifiques aux foyers
app.use('/api/foyer', foyerRoutes_1.default);
// Gestion des erreurs
app.use(errorHandler_1.errorHandler);
exports.default = app;
