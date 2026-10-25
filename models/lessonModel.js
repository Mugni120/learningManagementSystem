const db = require('../config/db');

exports.findByIdWithCourse = async (id) => {
  const [rows] = await db.query(
    `SELECT l.*, m.course_id, m.title AS module_title, c.instructor_id, c.title AS course_title
     FROM lessons l
     JOIN modules m ON m.id = l.module_id
     JOIN courses c ON c.id = m.course_id
     WHERE l.id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.create = async ({ module_id, title, content, video_url, duration_minutes, is_free_preview }) => {
  const [rows] = await db.query(
    'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM lessons WHERE module_id = ?',
    [module_id]
  );
  const [result] = await db.query(
    `INSERT INTO lessons (module_id, title, content, video_url, duration_minutes, position, is_free_preview)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [module_id, title, content, video_url, duration_minutes, rows[0].next_pos, is_free_preview]
  );
  return result.insertId;
};

exports.update = async (id, { title, content, video_url, duration_minutes, is_free_preview }) => {
  await db.query(
    `UPDATE lessons SET title = ?, content = ?, video_url = ?, duration_minutes = ?, is_free_preview = ?
     WHERE id = ?`,
    [title, content, video_url, duration_minutes, is_free_preview, id]
  );
};

exports.remove = async (id) => {
  await db.query('DELETE FROM lessons WHERE id = ?', [id]);
};
