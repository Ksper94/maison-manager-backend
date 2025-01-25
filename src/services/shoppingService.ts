import { prisma } from '../config/db';

interface CreateShoppingItemInput {
  name: string;
  quantity?: string;
  foyerId: string;
  assignedToId?: string;
  addedById?: string;
}

export async function createShoppingItem(data: CreateShoppingItemInput) {
  const { name, quantity, foyerId, assignedToId, addedById } = data;
  if (!name) {
    throw new Error('Le nom de l’article est obligatoire.');
  }

  const newItem = await prisma.shoppingItem.create({
    data: {
      name,
      quantity,
      foyerId,
      assignedToId,
      addedById
    }
  });
  return newItem;
}

export async function getAllShoppingItems(foyerId: string, purchased?: boolean) {
  const whereClause: any = { foyerId };
  if (typeof purchased === 'boolean') {
    whereClause.purchased = purchased;
  }

  const items = await prisma.shoppingItem.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true }
      },
      addedBy: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  return items;
}

export async function getShoppingItemById(itemId: string) {
  const item = await prisma.shoppingItem.findUnique({
    where: { id: itemId },
    include: {
      assignedTo: true,
      addedBy: true
    }
  });
  return item;
}

interface UpdateShoppingItemInput {
  itemId: string;
  name?: string;
  quantity?: string;
  purchased?: boolean;
  assignedToId?: string;
  // points?: number  // si tu veux un champ points sur ShoppingItem
}

export async function updateShoppingItem(data: UpdateShoppingItemInput) {
  const { itemId, name, quantity, purchased, assignedToId } = data;

  const existingItem = await prisma.shoppingItem.findUnique({
    where: { id: itemId },
    include: {
      assignedTo: true
    }
  });
  if (!existingItem) {
    throw new Error('Article introuvable.');
  }

  const wasPurchased = existingItem.purchased;

  const updated = await prisma.shoppingItem.update({
    where: { id: itemId },
    data: {
      name,
      quantity,
      purchased,
      assignedToId
    },
    include: {
      assignedTo: true
    }
  });

  // Système de points : si l'article est maintenant purchased=true et que ça ne l'était pas avant
  if (purchased === true && !wasPurchased) {
    // On attribue des points à l'utilisateur qui a acheté l'article
    // (ici, on suppose "assignedTo" est celui qui l'a acheté).
    if (updated.assignedTo) {
      // Ex: +5 points par article acheté
      await prisma.user.update({
        where: { id: updated.assignedTo.id },
        data: {
          points: { increment: 5 }
        }
      });
    }
  }

  return updated;
}

export async function deleteShoppingItem(itemId: string) {
  // vérifier si l'item existe
  const existingItem = await prisma.shoppingItem.findUnique({ where: { id: itemId } });
  if (!existingItem) {
    throw new Error('Article introuvable ou déjà supprimé.');
  }

  const deleted = await prisma.shoppingItem.delete({
    where: { id: itemId }
  });
  return deleted;
}
