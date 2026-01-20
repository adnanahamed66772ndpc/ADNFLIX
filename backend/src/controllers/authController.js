import pool from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { v4 as uuidv4 } from 'uuid';

// Register new user
export async function register(req, res, next) {
  try {
    const { email, password, displayName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 6 and 128 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    const userEmail = email.toLowerCase().trim();

    await pool.execute(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, userEmail, passwordHash]
    );

    // Create profile
    const profileId = uuidv4();
    await pool.execute(
      'INSERT INTO profiles (id, user_id, display_name, subscription_plan) VALUES (?, ?, ?, ?)',
      [profileId, userId, displayName || userEmail, 'free']
    );

    // Assign default 'user' role
    const roleId = uuidv4();
    await pool.execute(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [roleId, userId, 'user']
    );

    // Generate JWT token
    const token = generateToken({ userId, email: userEmail });

    // Set session
    req.session.userId = userId;
    req.session.email = userEmail;

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email: userEmail,
        displayName: displayName || userEmail
      }
    });
  } catch (error) {
    next(error);
  }
}

// Login user
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [users] = await pool.execute(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user profile and roles
    const [profiles] = await pool.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [user.id]
    );

    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [user.id]
    );

    const userRoles = roles.map(r => r.role);

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    // Set session
    req.session.userId = user.id;
    req.session.email = user.email;

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: profiles[0]?.display_name || null,
        avatarUrl: profiles[0]?.avatar_url || null,
        subscriptionPlan: profiles[0]?.subscription_plan || 'free',
        subscriptionExpiresAt: profiles[0]?.subscription_expires_at || null,
        roles: userRoles,
        createdAt: profiles[0]?.created_at || user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

// Logout user
export async function logout(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } catch (error) {
    next(error);
  }
}

// Get current user
export async function getCurrentUser(req, res, next) {
  try {
    const userId = req.userId;

    const [profiles] = await pool.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [users] = await pool.execute(
      'SELECT email, created_at FROM users WHERE id = ?',
      [userId]
    );

    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [userId]
    );

    const userRoles = roles.map(r => r.role);

    res.json({
      id: userId,
      email: users[0].email,
      displayName: profiles[0].display_name || null,
      avatarUrl: profiles[0].avatar_url || null,
      subscriptionPlan: profiles[0].subscription_plan || 'free',
      subscriptionExpiresAt: profiles[0].subscription_expires_at || null,
      roles: userRoles,
      createdAt: profiles[0].created_at || users[0].created_at
    });
  } catch (error) {
    next(error);
  }
}

// Update profile
export async function updateProfile(req, res, next) {
  try {
    const userId = req.userId;
    const { displayName, avatarUrl } = req.body;

    const updates = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), userId];

    await pool.execute(
      `UPDATE profiles SET ${setClause} WHERE user_id = ?`,
      values
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
}
