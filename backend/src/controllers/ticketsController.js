const pool = require('../config/database.js');
const { v4: uuidv4 } = require('uuid');
const { hasRole } = require('../middleware/roles.js');

// Get all tickets (admin sees all; users see only their own)
async function getTickets(req, res, next) {
  try {
    const { status, priority } = req.query;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin' || (userId && (await hasRole(userId, 'admin')));
    if (isAdmin && req.user) req.user.role = 'admin';

    let query = `
      SELECT 
        t.*,
        p.display_name as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM ticket_replies tr WHERE tr.ticket_id = t.id) as reply_count
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
    `;
    const params = [];

    // Build WHERE clause conditionally
    let hasWhere = false;
    
    if (!isAdmin) {
      // For non-admin users, userId must be present
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      query += ' WHERE t.user_id = ?';
      params.push(userId);
      hasWhere = true;
    }
    // Admin users can see all tickets, no WHERE clause needed

    // Add status filter if provided
    if (status && status.trim() !== '') {
      query += hasWhere ? ' AND' : ' WHERE';
      query += ' t.status = ?';
      params.push(status);
      hasWhere = true;
    }

    // Add priority filter if provided
    if (priority && priority.trim() !== '') {
      query += hasWhere ? ' AND' : ' WHERE';
      query += ' t.priority = ?';
      params.push(priority);
      hasWhere = true;
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// Get single ticket with replies
async function getTicketById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin' || (userId && (await hasRole(userId, 'admin')));
    if (isAdmin && req.user) req.user.role = 'admin';

    // Get ticket
    const [tickets] = await pool.execute(
      `SELECT 
        t.*,
        p.display_name as user_name,
        u.email as user_email
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE t.id = ?`,
      [id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Check permission
    if (!isAdmin && ticket.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get replies
    const [replies] = await pool.execute(
      `SELECT 
        tr.*,
        p.display_name as user_name,
        u.email as user_email
      FROM ticket_replies tr
      JOIN users u ON tr.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE tr.ticket_id = ?
      ORDER BY tr.created_at ASC`,
      [id]
    );

    res.json({ ...ticket, replies });
  } catch (error) {
    next(error);
  }
}

// Create new ticket
async function createTicket(req, res, next) {
  try {
    const { subject, message, priority = 'medium' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const id = uuidv4();
    await pool.execute(
      'INSERT INTO tickets (id, user_id, subject, message, priority) VALUES (?, ?, ?, ?, ?)',
      [id, userId, subject, message, priority]
    );

    res.status(201).json({ id, subject, message, priority, status: 'open' });
  } catch (error) {
    next(error);
  }
}

// Update ticket status (admin only)
async function updateTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }

    params.push(id);
    await pool.execute(
      `UPDATE tickets SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Ticket updated successfully' });
  } catch (error) {
    next(error);
  }
}

// Add reply to ticket
async function addReply(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin' || (userId && (await hasRole(userId, 'admin')));
    if (isAdmin && req.user) req.user.role = 'admin';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if ticket exists and user has access
    const [tickets] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [id]);
    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];
    if (!isAdmin && ticket.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add reply
    const replyId = uuidv4();
    await pool.execute(
      'INSERT INTO ticket_replies (id, ticket_id, user_id, message, is_admin) VALUES (?, ?, ?, ?, ?)',
      [replyId, id, userId, message, isAdmin]
    );

    // Update ticket status if admin replied
    if (isAdmin && ticket.status === 'open') {
      await pool.execute(
        'UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['in_progress', id]
      );
    }

    res.status(201).json({ id: replyId, message, is_admin: isAdmin });
  } catch (error) {
    next(error);
  }
}


module.exports = { getTickets, getTicketById, createTicket, updateTicket, addReply };
