const pool = require('../config/database.js');
const { v4: uuidv4  } = require('uuid');

// Get page content by key
async function getPageContent(req, res, next) {
  try {
    const { key } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM page_content WHERE page_key = ?',
      [key]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// Get all pages (admin only)
async function getAllPages(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, page_key, title, updated_at, updated_by FROM page_content ORDER BY page_key'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// Update page content (admin only)
async function updatePageContent(req, res, next) {
  try {
    const { key } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Check if page exists
    const [existing] = await pool.execute(
      'SELECT id FROM page_content WHERE page_key = ?',
      [key]
    );

    if (existing.length === 0) {
      // Create new page
      const id = uuidv4();
      await pool.execute(
        'INSERT INTO page_content (id, page_key, title, content, updated_by) VALUES (?, ?, ?, ?, ?)',
        [id, key, title, content, userId]
      );
      res.status(201).json({ id, page_key: key, title, content });
    } else {
      // Update existing page
      await pool.execute(
        'UPDATE page_content SET title = ?, content = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE page_key = ?',
        [title, content, userId, key]
      );
      res.json({ success: true, message: 'Page updated successfully' });
    }
  } catch (error) {
    next(error);
  }
}


module.exports = { getPageContent, getAllPages, updatePageContent };
