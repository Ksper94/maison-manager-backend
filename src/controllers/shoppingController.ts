import { Request, Response, NextFunction } from 'express';
import {
  createShoppingItem,
  getAllShoppingItems,
  getShoppingItemById,
  updateShoppingItem,
  deleteShoppingItem,
} from '../services/shoppingService';
import { prisma } from '../config/db';
import { sendPushNotification } from '../utils/notifications';

interface CustomRequest extends Request {
  userId?: string; // Typage étendu pour inclure userId injecté par le middleware
}

/**
 * Création d'un article dans la liste de courses
 */
export async function createShoppingItemController(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // Vérification de l'appartenance à un foyer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { foyerId: true, name: true },
    });

    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour ajouter un article.' });
    }

    const { name, quantity, assignedToId } = req.body;

    // Validation des champs
    if (!name) {
      return res.status(400).json({ message: "Le champ 'name' est obligatoire." });
    }

    // Création de l'article
    const item = await createShoppingItem({
      name,
      quantity,
      foyerId: user.foyerId,
      assignedToId,
      addedById: userId,
    });

    // Envoi de notifications aux membres du foyer
    const members = await prisma.user.findMany({
      where: { foyerId: user.foyerId },
      select: { pushToken: true },
    });

    const pushTokens = members
      .map((member) => member.pushToken)
      .filter((token): token is string => Boolean(token));

    for (const token of pushTokens) {
      await sendPushNotification(token, `${user.name} a ajouté "${name}" à la liste de courses.`);
    }

    return res.status(201).json({ message: 'Article ajouté avec succès.', item });
  } catch (error) {
    console.error('[createShoppingItemController] Erreur :', error);
    next(error);
  }
}

/**
 * Récupération de tous les articles de la liste de courses
 */
export async function getShoppingItemsController(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // Vérification de l'appartenance à un foyer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { foyerId: true },
    });

    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
    }

    // Filtre pour les articles achetés ou non
    const purchased = req.query.purchased === 'true' ? true : req.query.purchased === 'false' ? false : undefined;

    const items = await getAllShoppingItems(user.foyerId, purchased);
    return res.status(200).json(items);
  } catch (error) {
    console.error('[getShoppingItemsController] Erreur :', error);
    next(error);
  }
}

/**
 * Récupération d'un article spécifique par ID
 */
export async function getShoppingItemByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const itemId = req.params.itemId;

    const item = await getShoppingItemById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Article introuvable.' });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error('[getShoppingItemByIdController] Erreur :', error);
    next(error);
  }
}

/**
 * Mise à jour d'un article
 */
export async function updateShoppingItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const itemId = req.params.itemId;
    const { name, quantity, purchased, assignedToId } = req.body;

    const updatedItem = await updateShoppingItem({
      itemId,
      name,
      quantity,
      purchased,
      assignedToId,
    });

    return res.status(200).json({ message: 'Article mis à jour avec succès.', item: updatedItem });
  } catch (error) {
    console.error('[updateShoppingItemController] Erreur :', error);
    next(error);
  }
}

/**
 * Suppression d'un article
 */
export async function deleteShoppingItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const itemId = req.params.itemId;

    const deletedItem = await deleteShoppingItem(itemId);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Article introuvable ou déjà supprimé.' });
    }

    return res.status(200).json({ message: 'Article supprimé avec succès.', item: deletedItem });
  } catch (error) {
    console.error('[deleteShoppingItemController] Erreur :', error);
    next(error);
  }
}
