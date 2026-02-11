const express = require('express');
const {
  getTransactions,
  createTransaction,
  approveTransaction,
  rejectTransaction
} = require('../controllers/transactionsController.js');
const { authenticateJWT } = require('../middleware/auth.js');
const { requireAdmin, hasRole } = require('../middleware/roles.js');

const router = express.Router({ mergeParams: true });

// Middleware to set isAdmin flag
router.use(authenticateJWT);
router.use(async (req, res, next) => {
  if (req.userId) {
    req.isAdmin = await hasRole(req.userId, 'admin');
  }
  next();
});

// Approve/reject: match any path like /<id>/approve or /<id>/reject (handles proxy/encoding)
router.post(/\/approve\/?$/, requireAdmin, (req, res, next) => {
  const match = req.path.match(/^\/([^/]+)\/approve\/?$/);
  if (match) req.params.transactionId = req.params.transactionId || match[1];
  approveTransaction(req, res, next);
});
router.post(/\/reject\/?$/, requireAdmin, (req, res, next) => {
  const match = req.path.match(/^\/([^/]+)\/reject\/?$/);
  if (match) req.params.transactionId = req.params.transactionId || match[1];
  rejectTransaction(req, res, next);
});

router.get('/', getTransactions);
router.post('/', createTransaction);
router.post('/:transactionId/approve', requireAdmin, approveTransaction);
router.post('/:transactionId/reject', requireAdmin, rejectTransaction);

module.exports = router;
