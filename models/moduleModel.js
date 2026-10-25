const db = require('../config/db');

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM modules WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.create = async (courseId, title) => {
  const [rows] = await db.query(
    'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM modules WHERE course_id = ?',
    [courseId]
  );
  const [result] = await db.query(
    'INSERT INTO modules (course_id, title, position) VALUES (?, ?, ?)',
    [courseId, title, rows[0].next_pos]
  );
  return result.insertId;
};

exports.rename = async (id, title) => {
  await db.query('UPDATE modules SET title = ? WHERE id = ?', [title, id]);
};

exports.remove = async (id) => {
  await db.query('DELETE FROM modules WHERE id = ?', [id]);
};
