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

/**
 * Création d'un article dans la liste de courses
 */
export async function createShoppingItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    // Vérification de l'appartenance à un foyer
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { foyerId: true, name: true } });
    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Vous devez appartenir à un foyer pour ajouter un article.' });
    }

    const { name, quantity, assignedToId } = req.body;

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

    return res.status(201).json({
      message: 'Article ajouté à la liste de courses.',
      item,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * Récupération de tous les articles de la liste de courses
 */
export async function getShoppingItemsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    // Vérification de l'appartenance à un foyer
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { foyerId: true } });
    if (!user || !user.foyerId) {
      return res.status(403).json({ message: 'Accès refusé : pas de foyer.' });
    }

    // Filtre pour les articles achetés ou non
    const purchasedQuery = req.query.purchased as string | undefined;
    let purchased: boolean | undefined;
    if (purchasedQuery === 'true') purchased = true;
    if (purchasedQuery === 'false') purchased = false;

    const items = await getAllShoppingItems(user.foyerId, purchased);
    return res.status(200).json(items);
  } catch (error) {
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

    // Mise à jour de l'article
    const updated = await updateShoppingItem({
      itemId,
      name,
      quantity,
      purchased,
      assignedToId,
    });

    return res.status(200).json({
      message: 'Article mis à jour.',
      item: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Suppression d'un article
 */
export async function deleteShoppingItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const itemId = req.params.itemId;

    // Recherche de l'article avant suppression
    const item = await prisma.shoppingItem.findUnique({ where: { id: itemId }, select: { name: true, foyerId: true } });
    if (!item) {
      return res.status(404).json({ message: 'Article introuvable ou déjà supprimé.' });
    }

    // Suppression de l'article
    const deleted = await deleteShoppingItem(itemId);

    // Envoi de notifications aux membres du foyer
    const members = await prisma.user.findMany({
      where: { foyerId: item.foyerId },
      select: { pushToken: true },
    });

    const pushTokens = members
      .map((member) => member.pushToken)
      .filter((token): token is string => Boolean(token));

    for (const token of pushTokens) {
      await sendPushNotification(token, `L'article "${item.name}" a été supprimé de la liste de courses.`);
    }

    return res.status(200).json({
      message: 'Article supprimé de la liste.',
      item: deleted,
    });
  } catch (error: any) {
    next(error);
  }
}
