const express = require('express');
const {
  getUsers,
  updateUserRole,
  updateUserSubscription,
  deleteUser
} = require('../controllers/adminController.js');
const { authenticateJWT } = require('../middleware/auth.js');
const { requireAdmin } = require('../middleware/roles.js');

const router = express.Router();

router.get('/users', authenticateJWT, requireAdmin, getUsers);
router.put('/users/:userId/role', authenticateJWT, requireAdmin, updateUserRole);
router.put('/users/:userId/subscription', authenticateJWT, requireAdmin, updateUserSubscription);
router.delete('/users/:userId', authenticateJWT, requireAdmin, deleteUser);

module.exports = router;
