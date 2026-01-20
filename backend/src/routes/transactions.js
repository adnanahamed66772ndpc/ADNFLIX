import express from 'express';
import {
  getTransactions,
  createTransaction,
  approveTransaction,
  rejectTransaction
} from '../controllers/transactionsController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin, hasRole } from '../middleware/roles.js';

const router = express.Router();

// Middleware to set isAdmin flag
router.use(authenticateJWT);
router.use(async (req, res, next) => {
  if (req.userId) {
    req.isAdmin = await hasRole(req.userId, 'admin');
  }
  next();
});

router.get('/', getTransactions);
router.post('/', createTransaction);
router.post('/:transactionId/approve', requireAdmin, approveTransaction);
router.post('/:transactionId/reject', requireAdmin, rejectTransaction);

export default router;
