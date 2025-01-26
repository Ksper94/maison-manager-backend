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

  return prisma.shoppingItem.create({
    data: {
      name,
      quantity,
      foyerId,
      assignedToId,
      addedById,
    },
  });
}

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

export async function updateShoppingItem(data: UpdateShoppingItemInput) {
  const { itemId, name, quantity, purchased, assignedToId } = data;

  return prisma.shoppingItem.update({
    where: { id: itemId },
    data: {
      name,
      quantity,
      purchased,
      assignedToId,
    },
  });
}

export async function deleteShoppingItem(itemId: string) {
  return prisma.shoppingItem.delete({ where: { id: itemId } });
}
