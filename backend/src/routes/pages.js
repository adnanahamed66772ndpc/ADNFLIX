const express = require('express');
const {
  getPageContent,
  getAllPages,
  updatePageContent
} = require('../controllers/pagesController.js');
const { authenticateJWT } = require('../middleware/auth.js');
const { requireAdmin } = require('../middleware/roles.js');

const router = express.Router();

router.get('/:key', getPageContent);
router.get('/', authenticateJWT, requireAdmin, getAllPages);
router.put('/:key', authenticateJWT, requireAdmin, updatePageContent);

module.exports = router;
