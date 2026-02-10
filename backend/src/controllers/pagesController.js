const pool = require('../config/database.js');
const { v4: uuidv4 } = require('uuid');

// Default content for terms and privacy (used when page is missing in DB)
const DEFAULT_PAGES = {
  terms: {
    title: 'Terms of Service',
    content: '<h1>Terms of Service</h1><p>Welcome to ADNFLIX. By accessing or using our service, you agree to these Terms.</p><p>Please use the Admin panel to edit this content.</p>'
  },
  privacy: {
    title: 'Privacy Policy',
    content: '<h1>Privacy Policy</h1><p>ADNFLIX respects your privacy and protects your personal data.</p><p>Please use the Admin panel to edit this content.</p>'
  }
};

// Get page content by key. Creates terms/privacy with defaults if missing.
async function getPageContent(req, res, next) {
  try {
    const { key } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM page_content WHERE page_key = ?',
      [key]
    );

    if (rows.length > 0) {
      return res.json(rows[0]);
    }

    // For terms and privacy, create with default content so endpoint always works
    const defaultPage = DEFAULT_PAGES[key];
    if (defaultPage) {
      const id = uuidv4();
      await pool.execute(
        'INSERT INTO page_content (id, page_key, title, content) VALUES (?, ?, ?, ?)',
        [id, key, defaultPage.title, defaultPage.content]
      );
      const [newRows] = await pool.execute(
        'SELECT * FROM page_content WHERE page_key = ?',
        [key]
      );
      if (newRows.length > 0) {
        return res.json(newRows[0]);
      }
    }

    return res.status(404).json({ error: 'Page not found' });
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
