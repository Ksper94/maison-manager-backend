import { prisma } from '../config/db';
import { generateInvitationCode } from '../utils/generateInvitationCode';

/**
 * Crée un nouveau foyer et assigne immédiatement l'utilisateur comme membre
 * (avec acceptation de la règle).
 *
 * @param userId - ID de l'utilisateur (celui qui crée le foyer)
 * @param name - Nom du foyer
 * @param rule - Règle du foyer
 * @returns L'utilisateur mis à jour (contenant aussi l'info du foyer)
 */
export async function createFoyer(userId: string, name: string, rule: string) {
  try {
    // Vérifier si l'utilisateur existe bien dans la BDD
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('Utilisateur introuvable. Impossible de créer un foyer.');
    }

    // Vérifier si l'utilisateur appartient déjà à un foyer
    if (existingUser.foyerId) {
      throw new Error(
        'Vous appartenez déjà à un foyer. Impossible de créer un nouveau foyer.'
      );
    }

    // Générer un code unique d’invitation
    const code = generateInvitationCode(8); // 8 caractères aléatoires

    // Créer le foyer dans la base
    const newFoyer = await prisma.foyer.create({
      data: {
        name,
        code,
        rule,
      },
    });

    // Mettre à jour l'utilisateur pour l'associer au nouveau foyer
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        foyerId: newFoyer.id,
        acceptedFoyerRuleAt: new Date(),
      },
      include: {
        foyer: true, // Inclure les détails du foyer dans la réponse
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('[createFoyer] Erreur :', error);
    throw new Error(
      'Une erreur est survenue lors de la création du foyer. Veuillez réessayer.'
    );
  }
}

/**
 * Permet à un utilisateur de rejoindre un foyer via un code d'invitation.
 * On considère ici que le fait de rejoindre implique l'acceptation de la règle.
 *
 * @param userId - ID de l'utilisateur qui rejoint le foyer
 * @param code - Code d'invitation unique du foyer
 * @returns L'utilisateur mis à jour, avec la référence au foyer
 */
export async function joinFoyer(userId: string, code: string) {
  try {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('Utilisateur introuvable. Impossible de rejoindre un foyer.');
    }

    // Vérifier si l'utilisateur fait déjà partie d'un foyer
    if (existingUser.foyerId) {
      throw new Error(
        'Vous appartenez déjà à un foyer. Impossible de rejoindre un autre foyer.'
      );
    }

    // Trouver le foyer via le code d'invitation
    const foyer = await prisma.foyer.findUnique({
      where: { code },
    });

    if (!foyer) {
      throw new Error('Foyer introuvable ou code d’invitation invalide.');
    }

    // Mettre à jour l'utilisateur : associer le foyer et accepter la règle
    const updatedUser = await prisma.user.update({
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
  } catch (error) {
    console.error('[joinFoyer] Erreur :', error);
    throw new Error(
      'Une erreur est survenue lors de la tentative de rejoindre le foyer. Veuillez réessayer.'
    );
  }
}
