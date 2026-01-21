const express = require('express');
const { register, login, logout, getCurrentUser, updateProfile } = require('../controllers/authController.js');
const { authenticateJWT } = require('../middleware/auth.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, getCurrentUser);
router.put('/profile', authenticateJWT, updateProfile);

module.exports = router;
