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
  userId?: string;
}

/**
 * Récupère le premier foyerId trouvé pour un user dans la table pivot UserFoyer.
 */
async function getUserFoyerId(userId: string): Promise<string | null> {
  const userFoyerRecord = await prisma.userFoyer.findFirst({
    where: { userId },
  });
  return userFoyerRecord?.foyerId || null;
}

/**
 * Récupère tous les pushTokens des membres d'un foyer, via la table pivot.
 */
async function getFoyerMembersPushTokens(foyerId: string): Promise<string[]> {
  const userFoyerRecords = await prisma.userFoyer.findMany({
    where: { foyerId },
    include: {
      user: {
        select: { pushToken: true, name: true },
      },
    },
  });

  return userFoyerRecords
    .map((uf) => uf.user?.pushToken)
    .filter((token): token is string => Boolean(token));
}

/**
 * Création d'un article dans la liste de courses
 */
export async function createShoppingItemController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // On récupère le foyerId du user (premier foyer trouvé)
    const foyerId = await getUserFoyerId(userId);
    if (!foyerId) {
      return res
        .status(403)
        .json({ message: 'Vous devez appartenir à un foyer pour ajouter un article.' });
    }

    const { name, quantity, assignedToId } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Le champ 'name' est obligatoire." });
    }

    // Création de l'article via la couche service
    const item = await createShoppingItem({
      name,
      quantity: quantity || '1', // Par défaut, quantité = 1
      foyerId,
      assignedToId,
      addedById: userId,
    });

    // Pour la notification, on veut également le nom du user qui a ajouté
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const userName = user?.name || 'Quelqu\'un';

    // Récupérer les tokens des membres du foyer
    const pushTokens = await getFoyerMembersPushTokens(foyerId);

    for (const token of pushTokens) {
      await sendPushNotification(
        token,
        `${userName} a ajouté "${name}" à la liste de courses.`
      );
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
export async function getShoppingItemsController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // On récupère le foyerId
    const foyerId = await getUserFoyerId(userId);
    if (!foyerId) {
      return res
        .status(403)
        .json({ message: 'Accès refusé : vous n’appartenez à aucun foyer.' });
    }

    // Gestion du filtre "purchased"
    const purchasedQuery = req.query.purchased as string | undefined;
    const purchased =
      purchasedQuery === 'true'
        ? true
        : purchasedQuery === 'false'
        ? false
        : undefined;

    // Récupère les items via la couche service
    const items = await getAllShoppingItems(foyerId, purchased);
    console.log('[getShoppingItemsController] Articles trouvés :', items);

    return res.status(200).json(items);
  } catch (error) {
    console.error('[getShoppingItemsController] Erreur :', error);
    next(error);
  }
}

/**
 * Récupération d'un article spécifique par ID
 */
export async function getShoppingItemByIdController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
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
export async function updateShoppingItemController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
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

    return res
      .status(200)
      .json({ message: 'Article mis à jour avec succès.', item: updatedItem });
  } catch (error) {
    console.error('[updateShoppingItemController] Erreur :', error);
    next(error);
  }
}

/**
 * Suppression d'un article
 */
export async function deleteShoppingItemController(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const itemId = req.params.itemId;

    const deletedItem = await deleteShoppingItem(itemId);
    if (!deletedItem) {
      return res
        .status(404)
        .json({ message: 'Article introuvable ou déjà supprimé.' });
    }

    return res
      .status(200)
      .json({ message: 'Article supprimé avec succès.', item: deletedItem });
  } catch (error) {
    console.error('[deleteShoppingItemController] Erreur :', error);
    next(error);
  }
}
