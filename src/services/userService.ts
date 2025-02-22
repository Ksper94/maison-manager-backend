// src/services/userService.ts
import { prisma } from '../config/db';
import { JsonValue } from '@prisma/client'; // Importation de JsonValue pour typage correct des champs JSON

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
    rule: JsonValue; // Utilisation de JsonValue pour représenter un champ JSON
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
    // Requête Prisma pour récupérer l'utilisateur et ses foyers associés
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true, // Inclusion des détails du foyer
          },
        },
      },
    });

    // Vérification de l'existence de l'utilisateur
    if (!user) {
      throw new Error('Profil utilisateur non trouvé');
    }

    // Formatage des données pour correspondre au type UserProfile
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      foyers: user.foyers.map((uf) => ({
        id: uf.foyer.id,
        name: uf.foyer.name,
        code: uf.foyer.code,
        rule: uf.foyer.rule, // Typé comme JsonValue pour cohérence avec Prisma
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
  rule: JsonValue; // Typage correct pour le champ JSON
  createdAt: Date;
  updatedAt: Date;
}[]> {
  try {
    // Requête Prisma pour récupérer l'utilisateur et ses foyers
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true, // Inclusion des détails du foyer
          },
        },
      },
    });

    // Vérification de l'existence de l'utilisateur
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Mapping des foyers pour renvoyer uniquement les données nécessaires
    return user.foyers.map((uf) => ({
      id: uf.foyer.id,
      name: uf.foyer.name,
      code: uf.foyer.code,
      rule: uf.foyer.rule, // Typé comme JsonValue pour cohérence avec Prisma
      createdAt: uf.foyer.createdAt,
      updatedAt: uf.foyer.updatedAt,
    }));
  } catch (error) {
    console.error('[getUserFoyers] Erreur :', error);
    throw error;
  }
}
