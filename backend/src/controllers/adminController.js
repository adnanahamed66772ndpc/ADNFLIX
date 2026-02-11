const pool = require('../config/database.js');
const { v4: uuidv4 } = require('uuid');
const { hasRole } = require('../middleware/roles.js');

// Get all users (admin only)
async function getUsers(req, res, next) {
  try {
    const [profiles] = await pool.execute(
      'SELECT * FROM profiles ORDER BY created_at DESC'
    );

    const [roles] = await pool.execute(
      'SELECT user_id, role FROM user_roles'
    );

    const [users] = await pool.execute(
      'SELECT id, email, created_at FROM users'
    );

    const roleMap = new Map();
    roles.forEach(r => {
      if (!roleMap.has(r.user_id) || r.role === 'admin') {
        roleMap.set(r.user_id, r.role);
      }
    });

    const userMap = new Map();
    users.forEach(u => {
      userMap.set(u.id, u);
    });

    const adminUsers = profiles.map(profile => {
      const user = userMap.get(profile.user_id);
      return {
        id: profile.user_id,
        email: user?.email || '',
        displayName: profile.display_name || 'Unknown',
        avatarUrl: profile.avatar_url,
        role: roleMap.get(profile.user_id) || 'user',
        subscriptionPlan: profile.subscription_plan,
        subscriptionExpiresAt: profile.subscription_expires_at,
        createdAt: profile.created_at,
        status: 'active'
      };
    });

    res.json(adminUsers);
  } catch (error) {
    next(error);
  }
}

// Update user role (admin only)
async function updateUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Delete existing roles
    await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);

    // Insert new role
    const roleId = uuidv4();
    await pool.execute(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [roleId, userId, role]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Update user subscription (admin only)
async function updateUserSubscription(req, res, next) {
  try {
    const { userId } = req.params;
    const { plan, expiresAt } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }
    if (!['free', 'with-ads', 'premium'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Normalize expiry: free = null; otherwise valid date or null
    let expiresAtValue = null;
    if (plan !== 'free' && expiresAt != null && expiresAt !== '') {
      const d = new Date(expiresAt);
      if (!Number.isNaN(d.getTime())) {
        expiresAtValue = d.toISOString();
      }
    }

    const [existing] = await pool.execute(
      'SELECT user_id FROM profiles WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE profiles SET
          subscription_plan = ?,
          subscription_expires_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        [plan, expiresAtValue, userId]
      );
    } else {
      // Create profile if missing (user exists in users table)
      const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      await pool.execute(
        `INSERT INTO profiles (id, user_id, display_name, subscription_plan, subscription_expires_at)
         VALUES (?, ?, NULL, ?, ?)
         ON DUPLICATE KEY UPDATE
         subscription_plan = VALUES(subscription_plan),
         subscription_expires_at = VALUES(subscription_expires_at),
         updated_at = CURRENT_TIMESTAMP`,
        [uuidv4(), userId, plan, expiresAtValue]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('updateUserSubscription error:', error);
    next(error);
  }
}

// Delete user (admin only)
async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;

    // Delete user (cascade will handle related data)
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Get payment method settings (admin only) - for admin panel to edit numbers
async function getPaymentMethods(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, number, updated_at FROM payment_method_settings ORDER BY id'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// Update payment method (admin only) - set number/name for website and app
async function updatePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    const { name, number } = req.body;

    const [result] = await pool.execute(
      'UPDATE payment_method_settings SET name = COALESCE(?, name), number = COALESCE(?, number), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name || null, number != null ? String(number).trim() : null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { getUsers, updateUserRole, updateUserSubscription, deleteUser, getPaymentMethods, updatePaymentMethod };
