const pool = require('../config/database.js');
const { v4: uuidv4  } = require('uuid');

// Get transactions
async function getTransactions(req, res, next) {
  try {
    const userId = req.userId;
    const isAdmin = req.isAdmin; // Set by admin middleware

    let query = 'SELECT * FROM transactions';
    let params = [];

    if (!isAdmin) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC';

    const [transactions] = await pool.execute(query, params);

    res.json(transactions.map(t => ({
      id: t.id,
      orderId: t.order_id,
      userId: t.user_id,
      planId: t.plan_id,
      paymentMethod: t.payment_method,
      transactionId: t.transaction_id,
      senderNumber: t.sender_number || undefined,
      amount: Number(t.amount),
      status: t.status,
      rejectionReason: t.rejection_reason || undefined,
      processedAt: t.processed_at || undefined,
      processedBy: t.processed_by || undefined,
      createdAt: t.created_at
    })));
  } catch (error) {
    next(error);
  }
}

// Create transaction
async function createTransaction(req, res, next) {
  try {
    const userId = req.userId;
    const { planId, paymentMethod, transactionId, amount, senderNumber } = req.body;

    if (!planId || !paymentMethod || !transactionId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const orderId = `ORD-${Date.now()}`;

    await pool.execute(
      `INSERT INTO transactions (
        id, order_id, user_id, plan_id, payment_method,
        transaction_id, sender_number, amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        orderId,
        userId,
        planId,
        paymentMethod,
        transactionId,
        senderNumber || null,
        amount,
        'pending'
      ]
    );

    res.status(201).json({ id, orderId, success: true });
  } catch (error) {
    next(error);
  }
}

// Approve transaction (admin only)
async function approveTransaction(req, res, next) {
  try {
    const { transactionId } = req.params;
    const adminId = req.userId;

    // Get transaction
    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE id = ? AND status = ?',
      [transactionId, 'pending']
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or already processed' });
    }

    const transaction = transactions[0];

    // Update transaction
    await pool.execute(
      `UPDATE transactions SET 
        status = 'approved',
        processed_at = CURRENT_TIMESTAMP,
        processed_by = ?
      WHERE id = ?`,
      [adminId, transactionId]
    );

    // Update user subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await pool.execute(
      `UPDATE profiles SET
        subscription_plan = ?,
        subscription_expires_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
      [transaction.plan_id, expiresAt.toISOString(), transaction.user_id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Reject transaction (admin only)
async function rejectTransaction(req, res, next) {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    await pool.execute(
      `UPDATE transactions SET
        status = 'rejected',
        rejection_reason = ?,
        processed_at = CURRENT_TIMESTAMP,
        processed_by = ?
      WHERE id = ? AND status = 'pending'`,
      [reason || null, adminId, transactionId]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}


module.exports = { getTransactions, createTransaction, approveTransaction, rejectTransaction };
