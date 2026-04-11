/**
 * Transactions controller: create (user), list, approve/reject (admin).
 * Approve: normalizes plan_id to profiles ENUM (with-ads/premium), uses DB transaction,
 * handles missing profile, returns clear 400/404/500 so frontend never gets unhandled 500.
 */
const pool = require('../config/database.js');
const { v4: uuidv4 } = require('uuid');

/** Normalize plan_id from transactions to profiles ENUM: free | with-ads | premium */
function normalizePlanId(planId) {
  if (!planId || typeof planId !== 'string') return 'with-ads';
  const p = planId.toLowerCase().trim();
  if (p === 'premium') return 'premium';
  if (p === 'free') return 'free';
  if (p === 'with-ads' || p === 'with_ads' || p === 'withads' || p === 'basic') return 'with-ads';
  return 'with-ads';
}

// Get transactions (user sees own; admin sees all)
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
    console.error('getTransactions error:', error.message || error);
    next(error);
  }
}

// Create transaction (user submits payment request)
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

    return res.status(201).json({ id, orderId, success: true });
  } catch (error) {
    console.error('createTransaction error:', error.message || error);
    next(error);
  }
}

// Approve transaction (admin only). Uses DB transaction so we never approve without updating profile.
async function approveTransaction(req, res, next) {
  const transactionId = (req.params.transactionId || req.params.id || '').toString().trim();
  if (!transactionId) {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }

  const adminId = req.userId;
  if (!adminId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let connection;
  try {
    const [transactions] = await pool.execute(
      'SELECT id, user_id, plan_id FROM transactions WHERE id = ? AND status = ?',
      [transactionId, 'pending']
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or already processed' });
    }

    const transaction = transactions[0];
    const userId = transaction.user_id;
    if (!userId) {
      return res.status(400).json({ error: 'Transaction has no user' });
    }

    const planId = normalizePlanId(transaction.plan_id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE transactions SET
        status = 'approved',
        processed_at = CURRENT_TIMESTAMP,
        processed_by = ?
       WHERE id = ?`,
      [adminId, transactionId]
    );

    const [profileRows] = await connection.execute(
      'SELECT user_id FROM profiles WHERE user_id = ?',
      [userId]
    );

    if (profileRows.length > 0) {
      await connection.execute(
        `UPDATE profiles SET
          subscription_plan = ?,
          subscription_expires_at = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [planId, expiresAtStr, userId]
      );
    } else {
      const [userRows] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
      if (userRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'User not found' });
      }
      await connection.execute(
        `INSERT INTO profiles (id, user_id, display_name, subscription_plan, subscription_expires_at)
         VALUES (?, ?, NULL, ?, ?)
         ON DUPLICATE KEY UPDATE
         subscription_plan = VALUES(subscription_plan),
         subscription_expires_at = VALUES(subscription_expires_at),
         updated_at = CURRENT_TIMESTAMP`,
        [uuidv4(), userId, planId, expiresAtStr]
      );
    }

    await connection.commit();
    connection.release();
    connection = null;
    return res.json({ success: true });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        console.error('approveTransaction rollback error:', e);
      }
      try {
        connection.release();
      } catch (_) {}
    }
    console.error('approveTransaction error:', error.message || error, error.stack);
    const code = error.code;
    const msg = (error.message || '').toLowerCase();
    if (code === 'ER_NO_REFERENCED_ROW_2' || msg.includes('foreign key')) {
      return res.status(400).json({ error: 'User or admin not found in database' });
    }
    if (code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || msg.includes('enum')) {
      return res.status(400).json({ error: 'Invalid subscription plan value' });
    }
    res.status(500).json({
      error: 'Failed to approve transaction. Please try again or check server logs.',
    });
  }
}

// Reject transaction (admin only)
async function rejectTransaction(req, res, next) {
  const transactionId = (req.params.transactionId || req.params.id || '').toString().trim();
  if (!transactionId) {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE transactions SET
        status = 'rejected',
        rejection_reason = ?,
        processed_at = CURRENT_TIMESTAMP,
        processed_by = ?
       WHERE id = ? AND status = 'pending'`,
      [req.body?.reason ?? null, req.userId, transactionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found or already processed' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('rejectTransaction error:', error.message || error, error.stack);
    const code = error.code;
    if (code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Admin user not found in database' });
    }
    next(error);
  }
}


module.exports = { getTransactions, createTransaction, approveTransaction, rejectTransaction };
