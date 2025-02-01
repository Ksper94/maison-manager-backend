// src/services/userService.ts
import { prisma } from '../config/db';
import { User, Foyer } from '@prisma/client';

// Type pour refléter le profil utilisateur avec foyers
type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  foyers: {
    id: string;
    name: string;
    code: string;
    rule: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

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
        rule: uf.foyer.rule,
        createdAt: uf.foyer.createdAt,
        updatedAt: uf.foyer.updatedAt,
      })),
    };
  } catch (error) {
    console.error('Erreur dans getUserProfile:', error);
    throw error;
  }
}
// src/services/userService.ts

export async function getUserFoyers(userId: string) {
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

    // Retourne uniquement les foyers nécessaires
    return user.foyers.map((uf) => ({
      id: uf.foyer.id,
      name: uf.foyer.name,
      code: uf.foyer.code,
      rule: uf.foyer.rule,
      createdAt: uf.foyer.createdAt,
      updatedAt: uf.foyer.updatedAt,
    }));
  } catch (error) {
    console.error('[getUserFoyers] Erreur :', error);
    throw error;
  }
}
