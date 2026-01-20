import express from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoriesController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin routes
router.post('/', authenticateJWT, requireAdmin, createCategory);
router.put('/:id', authenticateJWT, requireAdmin, updateCategory);
router.delete('/:id', authenticateJWT, requireAdmin, deleteCategory);

export default router;
