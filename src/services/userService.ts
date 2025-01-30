// src/services/userService.ts
import { prisma } from '../config/db';
import { User, Foyer } from '@prisma/client';

/**
 * Récupère le profil de l'utilisateur incluant les informations des foyers
 * @param userId - ID de l'utilisateur
 * @returns Le profil de l'utilisateur
 */
export async function getUserProfile(userId: string): Promise<User & { foyers: Foyer[] }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true
          }
        }
      },
    });

    if (!user) {
      throw new Error('Profil utilisateur non trouvé');
    }

    // Mapper pour obtenir seulement les informations nécessaires des foyers
    const foyers = user.foyers.map(uf => uf.foyer);

    return {
      ...user,
      foyers: foyers
    };
  } catch (error) {
    console.error('Erreur dans getUserProfile:', error);
    throw error;
  }
}

/**
 * Récupère la liste des foyers de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @returns La liste des foyers de l'utilisateur
 */
export async function getUserFoyers(userId: string): Promise<Foyer[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          include: {
            foyer: true
          }
        }
      },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Retourner les foyers de l'utilisateur
    return user.foyers.map(uf => uf.foyer);
  } catch (error) {
    console.error('Erreur dans getUserFoyers:', error);
    throw error;
  }
}