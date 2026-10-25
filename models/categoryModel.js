const db = require('../config/db');

exports.findAll = async () => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

exports.create = async ({ name, slug }) => {
  const [result] = await db.query(
    'INSERT INTO categories (name, slug) VALUES (?, ?)',
    [name, slug]
  );
  return result.insertId;
};

exports.update = async (id, { name, slug }) => {
  await db.query('UPDATE categories SET name = ?, slug = ? WHERE id = ?', [name, slug, id]);
};

exports.remove = async (id) => {
  await db.query('DELETE FROM categories WHERE id = ?', [id]);
};

exports.slugExists = async (slug, exceptId = null) => {
  const [rows] = await db.query(
    'SELECT 1 FROM categories WHERE slug = ? AND id <> ? LIMIT 1',
    [slug, exceptId]
  );
  return rows.length > 0;
};
