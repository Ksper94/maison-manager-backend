import { prisma } from '../config/db';
import { generateInvitationCode } from '../utils/generateInvitationCode';
import { User, Foyer } from '@prisma/client';

/**
 * Définit le type de retour pour inclure l'utilisateur
 * et le tableau de pivots "foyers", chacun contenant la clé "foyer".
 * Exemple: updatedUser.foyers[0].foyer.id
 */
type UserWithFoyers = User & {
  foyers: Array<{
    foyer: Foyer
    // ... éventuellement d'autres champs de UserFoyer
  }>;
};

/**
 * Crée un nouveau foyer et assigne immédiatement l'utilisateur comme membre
 * (avec acceptation de la règle).
 *
 * @param userId - ID de l'utilisateur (celui qui crée le foyer)
 * @param name - Nom du foyer
 * @param rule - Règle du foyer
 * @returns L'utilisateur mis à jour (avec ses foyers et chaque foyer inclus)
 */
export async function createFoyer(
  userId: string,
  name: string,
  rule: string
): Promise<UserWithFoyers> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new Error('Utilisateur introuvable. Impossible de créer un foyer.');
    }

    // Génère un code unique (ex: "ABCDEFGH") pour l'invitation
    const code = generateInvitationCode(8);

    // 1) Crée le foyer
    const newFoyer = await prisma.foyer.create({
      data: {
        name,
        code,
        rule,
      },
    });

    // 2) Associe l'utilisateur au foyer dans la table pivot UserFoyer
    await prisma.userFoyer.create({
      data: {
        userId,
        foyerId: newFoyer.id,
      },
    });

    // 3) Récupère l'utilisateur "augmenté" (avec foyers -> foyer inclus)
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true, // on inclut l'objet Foyer
          },
        },
      },
    });

    if (!updatedUser) {
      throw new Error(
        "Erreur lors de la mise à jour de l'utilisateur après la création du foyer"
      );
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
 * @returns L'utilisateur mis à jour, avec la liste de ses foyers
 */
export async function joinFoyer(
  userId: string,
  code: string
): Promise<UserWithFoyers> {
  try {
    // On récupère déjà l'utilisateur avec les foyers auxquels il appartient
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true,
          },
        },
      },
    });

    if (!existingUser) {
      throw new Error('Utilisateur introuvable. Impossible de rejoindre un foyer.');
    }

    // On retrouve le foyer via son code
    const foyer = await prisma.foyer.findUnique({
      where: { code },
    });
    if (!foyer) {
      throw new Error('Foyer introuvable ou code invalide.');
    }

    // Vérifie si l'utilisateur est déjà membre de ce foyer
    const isAlreadyMember = existingUser.foyers.some(
      (uf) => uf.foyerId === foyer.id
    );
    if (isAlreadyMember) {
      // On renvoie simplement l'utilisateur tel quel
      return existingUser;
    }

    // Sinon, on le rattache au foyer dans la pivot table
    await prisma.userFoyer.create({
      data: {
        userId,
        foyerId: foyer.id,
      },
    });

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true,
          },
        },
      },
    });

    if (!updatedUser) {
      throw new Error(
        "Erreur lors de la mise à jour de l'utilisateur après avoir rejoint le foyer"
      );
    }

    return updatedUser;
  } catch (error) {
    console.error('Erreur dans joinFoyer:', error);
    throw error;
  }
}
