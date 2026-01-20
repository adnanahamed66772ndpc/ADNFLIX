import express from 'express';
import {
  getPageContent,
  getAllPages,
  updatePageContent
} from '../controllers/pagesController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

router.get('/:key', getPageContent);
router.get('/', authenticateJWT, requireAdmin, getAllPages);
router.put('/:key', authenticateJWT, requireAdmin, updatePageContent);

export default router;
