"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccessToken = exports.login = exports.register = exports.updateUserProfile = exports.getUserProfile = void 0;
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Importe les nouvelles fonctions Access/Refresh
const jwt_1 = require("../utils/jwt");
/**
 * Récupère le profil utilisateur avec son foyer actif
 */
const getUserProfile = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise' });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                foyers: {
                    select: { foyer: true }, // Inclure les détails du foyer
                },
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        const activeFoyer = user.foyers.length > 0 ? user.foyers[0].foyer : null;
        return res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                foyer: activeFoyer,
                pushToken: user.pushToken,
            },
        });
    }
    catch (error) {
        console.error('[getUserProfile] Erreur :', error);
        next(error);
    }
};
exports.getUserProfile = getUserProfile;
/**
 * Met à jour le profil utilisateur
 */
const updateUserProfile = async (req, res, next) => {
    try {
        const { userId } = req;
        const { name, avatar } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Authentification requise' });
        }
        if (!name && !avatar) {
            return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
        }
        const updatedUser = await db_1.prisma.user.update({
            where: { id: userId },
            data: {
                name: name || undefined,
                avatar: avatar || undefined,
            },
        });
        return res.status(200).json({
            message: 'Profil mis à jour avec succès',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                pushToken: updatedUser.pushToken,
            },
        });
    }
    catch (error) {
        console.error('[updateUserProfile] Erreur :', error);
        next(error);
    }
};
exports.updateUserProfile = updateUserProfile;
/**
 * Inscription d'un nouvel utilisateur
 * => On peut renvoyer directement les tokens si on veut auto-connecter l'utilisateur
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, avatar, pushToken } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
        }
        const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await db_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                avatar,
                pushToken,
            },
        });
        // Générer un accessToken (ex. 15m) et un refreshToken (ex. 7j)
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: newUser.id });
        const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: newUser.id });
        return res.status(201).json({
            message: 'Utilisateur créé avec succès',
            accessToken,
            refreshToken,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar,
                pushToken: newUser.pushToken,
            },
        });
    }
    catch (error) {
        console.error('[register] Erreur :', error);
        next(error);
    }
};
exports.register = register;
/**
 * Connexion d'un utilisateur (avec inclusion des foyers)
 */
const login = async (req, res, next) => {
    try {
        const { email, password, pushToken } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe sont obligatoires' });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { email },
            include: {
                foyers: {
                    select: { foyer: true },
                },
            },
        });
        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        // Vérifier le mot de passe haché
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        // Mettre à jour éventuellement le pushToken
        if (pushToken) {
            await db_1.prisma.user.update({
                where: { id: user.id },
                data: { pushToken },
            });
        }
        // Génération d'un access token et d'un refresh token
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id });
        const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id });
        const foyers = user.foyers.map((uf) => uf.foyer);
        return res.status(200).json({
            message: 'Connexion réussie',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                foyers,
                pushToken: user.pushToken,
            },
        });
    }
    catch (error) {
        console.error('[login] Erreur :', error);
        next(error);
    }
};
exports.login = login;
/**
 * Rafraîchir un access token à partir du refresh token
 * => Le frontend appelle /api/auth/refresh avec { refreshToken }
 */
const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token manquant' });
        }
        // Vérifie la validité du refresh token
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ message: 'Refresh token invalide ou expiré' });
        }
        // Vérifie que l'utilisateur existe
        const user = await db_1.prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        // Génère un nouveau access token et un nouveau refresh token si tu veux prolonger la session
        const newAccessToken = (0, jwt_1.generateAccessToken)({ userId: user.id });
        const newRefreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id });
        return res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (error) {
        console.error('[refreshAccessToken] Erreur :', error);
        return res.status(401).json({ message: 'Impossible de rafraîchir le token' });
    }
};
exports.refreshAccessToken = refreshAccessToken;
