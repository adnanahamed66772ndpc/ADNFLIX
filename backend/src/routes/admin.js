import express from 'express';
import {
  getUsers,
  updateUserRole,
  updateUserSubscription,
  deleteUser
} from '../controllers/adminController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/users', authenticateJWT, requireAdmin, getUsers);
router.put('/users/:userId/role', authenticateJWT, requireAdmin, updateUserRole);
router.put('/users/:userId/subscription', authenticateJWT, requireAdmin, updateUserSubscription);
router.delete('/users/:userId', authenticateJWT, requireAdmin, deleteUser);

export default router;
