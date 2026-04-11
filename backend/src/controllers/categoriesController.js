const pool = require('../config/database.js');
const { v4: uuidv4  } = require('uuid');

// Get all categories
async function getCategories(req, res, next) {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories';
    const params = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    query += ' ORDER BY name ASC';

    const [categories] = await pool.execute(query, params);

    res.json(categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      type: cat.type,
      description: cat.description || null,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at
    })));
  } catch (error) {
    next(error);
  }
}

// Get single category
async function getCategory(req, res, next) {
  try {
    const { id } = req.params;

    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const cat = categories[0];
    res.json({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      type: cat.type,
      description: cat.description || null,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at
    });
  } catch (error) {
    next(error);
  }
}

// Create category
async function createCategory(req, res, next) {
  try {
    const { name, slug, type = 'genre', description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    // Check if slug already exists
    const [existing] = await pool.execute(
      'SELECT id FROM categories WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }

    const categoryId = uuidv4();

    await pool.execute(
      'INSERT INTO categories (id, name, slug, type, description) VALUES (?, ?, ?, ?, ?)',
      [categoryId, name, slug, type, description || null]
    );

    res.status(201).json({
      id: categoryId,
      name,
      slug,
      type,
      description: description || null,
      message: 'Category created successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Update category
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, type, description } = req.body;

    // Check if category exists
    const [existing] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // If slug is being updated, check for conflicts
    if (slug) {
      const [slugCheck] = await pool.execute(
        'SELECT id FROM categories WHERE slug = ? AND id != ?',
        [slug, id]
      );

      if (slugCheck.length > 0) {
        return res.status(400).json({ error: 'Category with this slug already exists' });
      }
    }

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (slug !== undefined) {
      updateFields.push('slug = ?');
      values.push(slug);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      values.push(type);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await pool.execute(
      `UPDATE categories SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
}

// Delete category
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    // Check if category exists
    const [existing] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
}


module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
