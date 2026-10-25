const db = require('../config/db');

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.is_active, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

exports.emailExists = async (email) => {
  const [rows] = await db.query('SELECT 1 FROM users WHERE email = ? LIMIT 1', [email]);
  return rows.length > 0;
};

exports.create = async ({ role_id, full_name, email, password_hash }) => {
  const [result] = await db.query(
    'INSERT INTO users (role_id, full_name, email, password_hash) VALUES (?, ?, ?, ?)',
    [role_id, full_name, email, password_hash]
  );
  return result.insertId;
};

exports.findAllWithRoles = async () => {
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.is_active, u.created_at,
            r.id AS role_id, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ORDER BY u.id`
  );
  return rows;
};

exports.setRole = async (id, roleId) => {
  await db.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, id]);
};

exports.setActive = async (id, isActive) => {
  await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
};

exports.remove = async (id) => {
  await db.query('DELETE FROM users WHERE id = ?', [id]);
};

exports.countAll = async () => {
  const [rows] = await db.query('SELECT COUNT(*) AS total FROM users');
  return rows[0].total;
};
