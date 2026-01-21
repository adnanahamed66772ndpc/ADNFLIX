const pool = require('../config/database.js');

// Check if user has a specific role
async function hasRole(userId, role) {
  try {
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
      [userId, role]
    );
    return roles.length > 0;
  } catch (error) {
    return false;
  }
}

// Middleware to require admin role
async function requireAdmin(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isAdmin = await hasRole(req.userId, 'admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Set req.user object with role for compatibility with controllers
    if (!req.user) {
      req.user = {
        id: req.userId,
        email: req.userEmail
      };
    }
    req.user.role = isAdmin ? 'admin' : 'user';
    req.isAdmin = isAdmin;

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking permissions' });
  }
}

// Middleware to require specific role
function requireRole(role) {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasRequiredRole = await hasRole(req.userId, role);
      if (!hasRequiredRole) {
        return res.status(403).json({ error: `Role '${role}' required` });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Error checking permissions' });
    }
  };
}

module.exports = { hasRole, requireAdmin, requireRole };
