// src/routes/shoppingRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { hasFoyerMiddleware } from '../middlewares/hasFoyerMiddleware';

import {
  createShoppingItemController,
  getShoppingItemsController,
  getShoppingItemByIdController,
  updateShoppingItemController,
  deleteShoppingItemController
} from '../controllers/shoppingController';

const router = Router();

router.post('/', authMiddleware, hasFoyerMiddleware, createShoppingItemController);
router.get('/', authMiddleware, hasFoyerMiddleware, getShoppingItemsController);
router.get('/:itemId', authMiddleware, hasFoyerMiddleware, getShoppingItemByIdController);
router.patch('/:itemId', authMiddleware, hasFoyerMiddleware, updateShoppingItemController);
router.delete('/:itemId', authMiddleware, hasFoyerMiddleware, deleteShoppingItemController);

export default router;
