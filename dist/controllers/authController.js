"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../config/db");
const jwt_1 = require("../utils/jwt");
const register = async (req, res, next) => {
    try {
        const { name, email, password, avatar } = req.body;
        // Vérification si l'utilisateur existe déjà
        const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        // Hash du mot de passe
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Création de l'utilisateur
        const newUser = await db_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                avatar,
            },
        });
        return res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Vérif utilisateur
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        // Vérif password
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        // Génération du token
        const token = (0, jwt_1.generateToken)({ userId: user.id });
        return res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
