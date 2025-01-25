import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db';
import { generateToken } from '../utils/jwt';

/**
 * Enregistrement d'un nouvel utilisateur
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, avatar, pushToken } = req.body;

    // Validation des champs
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    // Vérification si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatar,
        pushToken, // Ajout du token push
      },
    });

    // Réponse avec les données essentielles
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
    console.error('Erreur lors de l\'enregistrement :', error);
    next(error); // Passe l'erreur au middleware global d'erreurs
  }
};

/**
 * Connexion d'un utilisateur
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, pushToken } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont obligatoires' });
    }

    // Vérification de l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Mise à jour du pushToken si fourni
    if (pushToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pushToken },
      });
    }

    // Génération du token JWT
    const token = generateToken({ userId: user.id });

    // Réponse avec le token et les informations utilisateur
    return res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        pushToken: user.pushToken,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    next(error); // Passe l'erreur au middleware global d'erreurs
  }
};
