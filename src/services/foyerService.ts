// src/services/foyerService.ts
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
export async function createFoyer(userId: string, name: string, rule: string): Promise<User & { foyers: Foyer[] }> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('Utilisateur introuvable. Impossible de créer un foyer.');
    }

    const code = generateInvitationCode(8);

    const newFoyer = await prisma.foyer.create({
      data: {
        name,
        code,
        rule,
      },
    });

    // Associer l'utilisateur au nouveau foyer
    const userFoyer = await prisma.userFoyer.create({
      data: {
        userId: userId,
        foyerId: newFoyer.id,
      },
    });

    // Mettre à jour l'utilisateur pour inclure le nouveau foyer
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true
          }
        }
      },
    });

    if (!updatedUser) {
      throw new Error('Erreur lors de la mise à jour de l\'utilisateur après la création du foyer');
    }

    return updatedUser;
  } catch (error) {
    console.error('Erreur dans createFoyer:', error);
    throw error;
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
export async function joinFoyer(userId: string, code: string): Promise<User & { foyers: Foyer[] }> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { foyers: { include: { foyer: true } } },
    });

    if (!existingUser) {
      throw new Error('Utilisateur introuvable. Impossible de rejoindre un foyer.');
    }

    // Trouver le foyer via le code
    const foyer = await prisma.foyer.findUnique({
      where: { code },
    });

    if (!foyer) {
      throw new Error('Foyer introuvable ou code invalide.');
    }

    // Vérifier si l'utilisateur est déjà membre de ce foyer
    const isAlreadyMember = existingUser.foyers.some(uf => uf.foyerId === foyer.id);
    if (isAlreadyMember) {
      return existingUser;
    }

    // Associer l'utilisateur au foyer
    await prisma.userFoyer.create({
      data: {
        userId: userId,
        foyerId: foyer.id,
      },
    });

    // Récupérer l'utilisateur mis à jour avec les informations du nouveau foyer
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true
          }
        }
      },
    });

    if (!updatedUser) {
      throw new Error('Erreur lors de la mise à jour de l\'utilisateur après avoir rejoint le foyer');
    }

    return updatedUser;
  } catch (error) {
    console.error('Erreur dans joinFoyer:', error);
    throw error;
  }
}