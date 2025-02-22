// src/services/userService.ts
import { prisma } from '../config/db';
import { Prisma } from '@prisma/client'; // Importation de Prisma pour les types internes

// Type représentant le profil utilisateur avec ses foyers
type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  foyers: {
    id: string;
    name: string;
    code: string;
    rule: Prisma.JsonValue; // Utilisation de Prisma.JsonValue
    createdAt: Date;
    updatedAt: Date;
  }[];
};

/**
 * Récupère le profil complet d'un utilisateur, incluant ses foyers.
 * @param userId L'identifiant de l'utilisateur
 * @returns Une promesse résolue avec le profil utilisateur
 * @throws Une erreur si l'utilisateur n'est pas trouvé
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Profil utilisateur non trouvé');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      foyers: user.foyers.map((uf) => ({
        id: uf.foyer.id,
        name: uf.foyer.name,
        code: uf.foyer.code,
        rule: uf.foyer.rule, // Typé comme Prisma.JsonValue
        createdAt: uf.foyer.createdAt,
        updatedAt: uf.foyer.updatedAt,
      })),
    };
  } catch (error) {
    console.error('Erreur dans getUserProfile:', error);
    throw error;
  }
}

/**
 * Récupère la liste des foyers associés à un utilisateur.
 * @param userId L'identifiant de l'utilisateur
 * @returns Une promesse résolue avec la liste des foyers
 * @throws Une erreur si l'utilisateur n'est pas trouvé
 */
export async function getUserFoyers(userId: string): Promise<{
  id: string;
  name: string;
  code: string;
  rule: Prisma.JsonValue; // Utilisation de Prisma.JsonValue
  createdAt: Date;
  updatedAt: Date;
}[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return user.foyers.map((uf) => ({
      id: uf.foyer.id,
      name: uf.foyer.name,
      code: uf.foyer.code,
      rule: uf.foyer.rule, // Typé comme Prisma.JsonValue
      createdAt: uf.foyer.createdAt,
      updatedAt: uf.foyer.updatedAt,
    }));
  } catch (error) {
    console.error('[getUserFoyers] Erreur :', error);
    throw error;
  }
}
