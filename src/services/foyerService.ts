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
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error('Utilisateur introuvable. Impossible de créer un foyer.');
  }

  if (existingUser.foyerId) {
    throw new Error(
      'Vous appartenez déjà à un foyer. Impossible de créer un nouveau foyer.'
    );
  }

  const code = generateInvitationCode(8);

  const newFoyer = await prisma.foyer.create({
    data: {
      name,
      code,
      rule,
    },
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      foyerId: newFoyer.id,
      acceptedFoyerRuleAt: new Date(),
    },
    include: {
      foyer: true,
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
export async function joinFoyer(userId: string, code: string) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { foyer: true }, // Inclure les infos sur le foyer pour comparaison
  });

  if (!existingUser) {
    throw new Error('Utilisateur introuvable. Impossible de rejoindre un foyer.');
  }

  // Vérifie si l'utilisateur est déjà membre d'un foyer
  if (existingUser.foyerId) {
    // Vérifie si l'utilisateur essaie de rejoindre son propre foyer
    const foyer = await prisma.foyer.findUnique({ where: { code } });

    if (foyer && foyer.id === existingUser.foyerId) {
      // Si l'utilisateur est déjà membre du foyer, renvoie directement ses infos
      return existingUser;
    }

    throw new Error(
      'Vous appartenez déjà à un foyer. Impossible de rejoindre un autre foyer.'
    );
  }

  // Trouver le foyer via le code
  const foyer = await prisma.foyer.findUnique({
    where: { code },
  });

  if (!foyer) {
    throw new Error('Foyer introuvable ou code invalide.');
  }

  // Associer l'utilisateur au foyer
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
}
