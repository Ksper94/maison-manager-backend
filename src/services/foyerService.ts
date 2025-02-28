import { prisma } from '../config/db';
import { generateInvitationCode } from '../utils/generateInvitationCode';
import { User, Foyer } from '@prisma/client';

/**
 * Définit le type de retour pour inclure l'utilisateur
 * et le tableau de pivots "foyers", chacun contenant la clé "foyer".
 */
type UserWithFoyers = User & {
  foyers: Array<{
    foyer: Foyer;
  }>;
};

/**
 * Crée un nouveau foyer et assigne immédiatement l'utilisateur comme membre.
 * L'utilisateur accepte automatiquement la règle du foyer.
 *
 * @param userId - ID de l'utilisateur (celui qui crée le foyer)
 * @param name - Nom du foyer
 * @param rule - Règle du foyer (chaîne ou objet JSON selon votre modèle Prisma)
 * @returns L'utilisateur mis à jour (avec ses foyers et chaque foyer inclus)
 */
export async function createFoyer(
  userId: string,
  name: string,
  rule: string // ou Record<string, string[]> si vous utilisez un objet JSON
): Promise<UserWithFoyers> {
  try {
    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('Utilisateur introuvable. Impossible de créer un foyer.');
    }

    // Génération du code d'invitation unique
    const code = generateInvitationCode(8);

    // 1) Création du foyer
    const newFoyer = await prisma.foyer.create({
      data: {
        name,
        code,
        rule, // Compatible avec une string ou un JSON selon votre schéma Prisma
      },
    });

    // 2) Associer l'utilisateur au foyer dans la table pivot
    await prisma.userFoyer.create({
      data: {
        userId,
        foyerId: newFoyer.id,
      },
    });

    // 3) Mise à jour de l'utilisateur pour accepter automatiquement la règle
    await prisma.user.update({
      where: { id: userId },
      data: {
        acceptedFoyerRuleAt: new Date(), // Accepter la règle immédiatement
      },
    });

    // 4) Récupération de l'utilisateur mis à jour avec ses foyers
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true, // Inclure les informations du foyer
          },
        },
      },
    });

    if (!updatedUser) {
      throw new Error("Erreur lors de la mise à jour de l'utilisateur après création du foyer");
    }

    return updatedUser;
  } catch (error) {
    console.error('[createFoyer] Erreur :', error);
    throw error;
  }
}

/**
 * Permet à un utilisateur de rejoindre un foyer via un code d'invitation.
 * L'utilisateur accepte automatiquement la règle du foyer en rejoignant.
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
    // Vérifier si l'utilisateur existe et récupérer ses foyers
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

    // Vérifier si le foyer existe avec le code d'invitation
    const foyer = await prisma.foyer.findUnique({
      where: { code },
    });

    if (!foyer) {
      throw new Error('Foyer introuvable ou code invalide.');
    }

    // Vérifier si l'utilisateur est déjà membre de ce foyer
    const isAlreadyMember = existingUser.foyers.some(
      (uf) => uf.foyer.id === foyer.id
    );

    if (isAlreadyMember) {
      return existingUser; // Il est déjà dans le foyer, on retourne l'utilisateur tel quel
    }

    // Ajouter l'utilisateur à la table pivot UserFoyer
    await prisma.userFoyer.create({
      data: {
        userId,
        foyerId: foyer.id,
      },
    });

    // Mise à jour de l'utilisateur pour accepter la règle du foyer
    await prisma.user.update({
      where: { id: userId },
      data: {
        acceptedFoyerRuleAt: new Date(), // L'utilisateur accepte la règle en rejoignant
      },
    });

    // Récupérer l'utilisateur mis à jour avec ses foyers
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
      throw new Error("Erreur lors de la mise à jour de l'utilisateur après avoir rejoint le foyer");
    }

    return updatedUser;
  } catch (error) {
    console.error('[joinFoyer] Erreur :', error);
    throw error;
  }
}

/**
 * Met à jour les règles d'un foyer spécifique.
 *
 * @param foyerId - ID du foyer à mettre à jour
 * @param rules - Nouvelles règles à appliquer au foyer (chaîne ou objet JSON)
 * @returns L'utilisateur mis à jour avec ses foyers
 */
export async function updateFoyerRules(
  foyerId: string,
  rules: string // ou Record<string, string[]> si vous utilisez un objet JSON
): Promise<UserWithFoyers> {
  try {
    // Vérifier que le foyer existe
    const foyer = await prisma.foyer.findUnique({
      where: { id: foyerId },
    });

    if (!foyer) {
      throw new Error('Foyer introuvable.');
    }

    // Mettre à jour les règles du foyer
    await prisma.foyer.update({
      where: { id: foyerId },
      data: { rule: rules },
    });

    // Récupérer le premier utilisateur associé au foyer
    const updatedUser = await prisma.user.findFirst({
      where: {
        foyers: {
          some: { foyerId },
        },
      },
      include: {
        foyers: {
          include: {
            foyer: true,
          },
        },
      },
    });

    if (!updatedUser) {
      throw new Error('Aucun utilisateur associé à ce foyer.');
    }

    return updatedUser;
  } catch (error) {
    console.error('[updateFoyerRules] Erreur :', error);
    throw error;
  }
}