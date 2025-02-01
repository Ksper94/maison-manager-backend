import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';

/**
 * Récupère le profil utilisateur avec son foyer actif
 */
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as any;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foyers: {
          select: { foyer: true }, // Inclure les détails du foyer
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const activeFoyer = user.foyers.length > 0 ? user.foyers[0].foyer : null;

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        foyer: activeFoyer,
        pushToken: user.pushToken,
      },
    });
  } catch (error) {
    console.error('[getUserProfile] Erreur :', error);
    next(error);
  }
};

/**
 * Met à jour le profil utilisateur
 */
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as any;
    const { name, avatar } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    if (!name && !avatar) {
      return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        avatar: avatar || undefined,
      },
    });

    return res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        pushToken: updatedUser.pushToken,
      },
    });
  } catch (error) {
    console.error('[updateUserProfile] Erreur :', error);
    next(error);
  }
};

/**
 * Inscription d'un nouvel utilisateur
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, avatar, pushToken } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatar,
        pushToken,
      },
    });

    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        pushToken: newUser.pushToken,
      },
    });
  } catch (error) {
    console.error('[register] Erreur :', error);
    next(error);
  }
};

/**
 * Connexion d'un utilisateur avec inclusion des foyers
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, pushToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont obligatoires' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        foyers: {
          select: { foyer: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    if (pushToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pushToken },
      });
    }

    const token = generateToken({ userId: user.id });

    const foyers = user.foyers.map((uf) => uf.foyer);

    return res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        foyers,
        pushToken: user.pushToken,
      },
    });
  } catch (error) {
    console.error('[login] Erreur :', error);
    next(error);
  }
};
