"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const server = http_1.default.createServer(app_1.default);
const PORT = env_1.config.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
