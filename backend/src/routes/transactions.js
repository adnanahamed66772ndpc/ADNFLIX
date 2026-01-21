const express = require('express');
const {
  getTransactions,
  createTransaction,
  approveTransaction,
  rejectTransaction
} = require('../controllers/transactionsController.js');
const { authenticateJWT } = require('../middleware/auth.js');
const { requireAdmin, hasRole } = require('../middleware/roles.js');

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

module.exports = router;
