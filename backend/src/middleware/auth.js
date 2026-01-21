const { verifyToken } = require('../utils/jwt.js');

// JWT Authentication middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // Try session as fallback
    if (req.session && req.session.userId) {
      req.userId = req.session.userId;
      req.userEmail = req.session.email;
      req.user = {
        id: req.session.userId,
        email: req.session.email,
        role: 'user' // Default role, will be updated by requireAdmin if admin
      };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = decoded.userId;
  req.userEmail = decoded.email;
  // Set req.user object for compatibility with controllers
  // Role will be set by requireAdmin middleware if needed
  req.user = {
    id: decoded.userId,
    email: decoded.email,
    role: 'user' // Default role, will be updated by requireAdmin if admin
  };
  next();
}

// Session authentication middleware
function authenticateSession(req, res, next) {
    if (req.session && req.session.userId) {
      req.userId = req.session.userId;
      req.userEmail = req.session.email;
      req.user = {
        id: req.session.userId,
        email: req.session.email,
        role: 'user'
      };
      return next();
    }

    // Try JWT as fallback
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: 'user'
        };
        return next();
      }
    }

  return res.status(401).json({ error: 'Authentication required' });
}

// Optional authentication (doesn't fail if not authenticated)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: 'user'
      };
    }
  } else if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.userEmail = req.session.email;
    req.user = {
      id: req.session.userId,
      email: req.session.email,
      role: 'user'
    };
  }

  next();
}

module.exports = { authenticateJWT, authenticateSession, optionalAuth };
