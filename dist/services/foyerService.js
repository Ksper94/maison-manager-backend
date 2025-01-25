"use strict";
// src/services/foyerService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFoyer = createFoyer;
exports.joinFoyer = joinFoyer;
const db_1 = require("../config/db");
const generateInvitationCode_1 = require("../utils/generateInvitationCode");
/**
 * Crée un nouveau foyer et assigne immédiatement l'utilisateur comme membre
 * (avec acceptation de la règle).
 *
 * @param userId - ID de l'utilisateur (celui qui crée le foyer)
 * @param name - Nom du foyer
 * @param rule - Règle du foyer
 * @returns L'utilisateur mis à jour (contenant aussi l'info du foyer)
 */
async function createFoyer(userId, name, rule) {
    // Vérifier si l'utilisateur existe bien dans la BDD
    const existingUser = await db_1.prisma.user.findUnique({
        where: { id: userId }
    });
    if (!existingUser) {
        throw new Error('Utilisateur introuvable. Impossible de créer un foyer.');
    }
    // Optionnel : vérifier si l'utilisateur appartient déjà à un foyer
    if (existingUser.foyerId) {
        // Selon la logique métier, on peut soit interdire, soit permettre
        // la création d'un nouveau foyer. Ici, on interdit.
        throw new Error('Vous appartenez déjà à un foyer. Impossible de créer un nouveau foyer.');
    }
    // 1. Générer un code unique d’invitation
    const code = (0, generateInvitationCode_1.generateInvitationCode)(8); // 8 caractères aléatoires
    // 2. Créer le foyer dans la base
    const newFoyer = await db_1.prisma.foyer.create({
        data: {
            name,
            code,
            rule,
        },
    });
    // 3. Mettre à jour l'utilisateur pour l'associer au nouveau foyer
    //    et marquer la date d'acceptation de la règle
    const updatedUser = await db_1.prisma.user.update({
        where: { id: userId },
        data: {
            foyerId: newFoyer.id,
            acceptedFoyerRuleAt: new Date(),
        },
        include: {
            foyer: true, // pour renvoyer directement la data du foyer
        },
    });
    return updatedUser;
}
/**
 * Permet à un utilisateur de rejoindre un foyer via un code d'invitation.
 * On considère ici que le fait de rejoindre implique l'acceptation de la règle.
 *
 * @param userId - ID de l'utilisateur qui rejoint le foyer
 * @param code - Code d'invitation unique du foyer
 * @returns L'utilisateur mis à jour, avec la référence au foyer
 */
async function joinFoyer(userId, code) {
    // Vérifier si l'utilisateur existe
    const existingUser = await db_1.prisma.user.findUnique({
        where: { id: userId }
    });
    if (!existingUser) {
        throw new Error('Utilisateur introuvable. Impossible de rejoindre un foyer.');
    }
    // Optionnel : vérifier si l'utilisateur fait déjà partie d'un foyer
    if (existingUser.foyerId) {
        // On peut décider de le laisser changer de foyer ou de lever une erreur.
        // Ici, on lève une erreur.
        throw new Error('Vous appartenez déjà à un foyer. Impossible de rejoindre un autre foyer.');
    }
    // 1. Trouver le foyer via le code d'invitation
    const foyer = await db_1.prisma.foyer.findUnique({
        where: { code },
    });
    // 2. Vérifier que ce foyer existe
    if (!foyer) {
        throw new Error('Foyer introuvable ou code invalide.');
    }
    // 3. Mettre à jour l'utilisateur : associer le foyer et accepter la règle
    const updatedUser = await db_1.prisma.user.update({
        where: { id: userId },
        data: {
            foyerId: foyer.id,
            acceptedFoyerRuleAt: new Date(),
        },
        include: {
            foyer: true,
        },
    });
    return updatedUser;
}
