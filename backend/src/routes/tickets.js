import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addReply
} from '../controllers/ticketsController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

router.get('/', authenticateJWT, getTickets);
router.get('/:id', authenticateJWT, getTicketById);
router.post('/', authenticateJWT, createTicket);
router.put('/:id', authenticateJWT, requireAdmin, updateTicket);
router.post('/:id/replies', authenticateJWT, addReply);

export default router;
