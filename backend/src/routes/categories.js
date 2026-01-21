const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoriesController.js');
const { authenticateJWT } = require('../middleware/auth.js');
const { requireAdmin } = require('../middleware/roles.js');

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin routes
router.post('/', authenticateJWT, requireAdmin, createCategory);
router.put('/:id', authenticateJWT, requireAdmin, updateCategory);
router.delete('/:id', authenticateJWT, requireAdmin, deleteCategory);

module.exports = router;
