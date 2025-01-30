import { prisma } from '../config/db';

interface CreateShoppingItemInput {
  name: string;
  quantity?: string;
  foyerId: string;
  assignedToId?: string;
  addedById?: string;
}

/**
 * Créer un nouvel article de la liste de courses pour un foyer.
 */
export async function createShoppingItem(data: CreateShoppingItemInput) {
  const { name, quantity, foyerId, assignedToId, addedById } = data;

  if (!name.trim()) {
    throw new Error('Le nom de l’article est obligatoire.');
  }

  if (quantity && (isNaN(Number(quantity)) || Number(quantity) <= 0)) {
    throw new Error('La quantité doit être un nombre valide supérieur à 0.');
  }

  return prisma.shoppingItem.create({
    data: {
      name: name.trim(),
      quantity: quantity?.trim(),
      foyerId,
      assignedToId,
      addedById,
    },
  });
}

/**
 * Récupérer tous les articles d’un foyer,
 * éventuellement filtrés par "purchased".
 */
export async function getAllShoppingItems(foyerId: string, purchased?: boolean) {
  const whereClause: any = { foyerId };
  if (typeof purchased === 'boolean') {
    whereClause.purchased = purchased;
  }

  return prisma.shoppingItem.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      addedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Récupérer un article spécifique par ID, 
 * en incluant qui l’a ajouté et à qui il est assigné.
 */
export async function getShoppingItemById(itemId: string) {
  return prisma.shoppingItem.findUnique({
    where: { id: itemId },
    include: {
      assignedTo: true,
      addedBy: true,
    },
  });
}

interface UpdateShoppingItemInput {
  itemId: string;
  name?: string;
  quantity?: string;
  purchased?: boolean;
  assignedToId?: string;
}

/**
 * Mettre à jour un article de la liste de courses.
 */
export async function updateShoppingItem(data: UpdateShoppingItemInput) {
  const { itemId, name, quantity, purchased, assignedToId } = data;

  if (quantity && (isNaN(Number(quantity)) || Number(quantity) <= 0)) {
    throw new Error('La quantité doit être un nombre valide supérieur à 0.');
  }

  return prisma.shoppingItem.update({
    where: { id: itemId },
    data: {
      name: name?.trim(),
      quantity: quantity?.trim(),
      purchased,
      assignedToId,
    },
  });
}

/**
 * Supprime un article par ID.
 */
export async function deleteShoppingItem(itemId: string) {
  return prisma.shoppingItem.delete({ where: { id: itemId } });
}
