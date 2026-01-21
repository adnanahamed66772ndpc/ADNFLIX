const express = require('express');
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addReply
} = require('../controllers/ticketsController.js');
const { authenticateJWT } = require('../middleware/auth.js');
const { requireAdmin } = require('../middleware/roles.js');

const router = express.Router();

router.get('/', authenticateJWT, getTickets);
router.get('/:id', authenticateJWT, getTicketById);
router.post('/', authenticateJWT, createTicket);
router.put('/:id', authenticateJWT, requireAdmin, updateTicket);
router.post('/:id/replies', authenticateJWT, addReply);

module.exports = router;
