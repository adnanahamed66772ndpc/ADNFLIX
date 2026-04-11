const express = require('express');
const { register, login, logout, getCurrentUser, updateProfile, changePassword, checkSubscription } = require('../controllers/authController.js');
const { authenticateJWT } = require('../middleware/auth.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, getCurrentUser);
router.get('/subscription/check', authenticateJWT, checkSubscription);
router.put('/profile', authenticateJWT, updateProfile);
router.patch('/password', authenticateJWT, changePassword);

module.exports = router;
