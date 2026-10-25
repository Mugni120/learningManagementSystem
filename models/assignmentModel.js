const db = require('../config/db');

exports.findByCourse = async (courseId) => {
  const [rows] = await db.query(
    'SELECT * FROM assignments WHERE course_id = ? ORDER BY due_at IS NULL, due_at',
    [courseId]
  );
  return rows;
};

exports.findByIdWithCourse = async (id) => {
  const [rows] = await db.query(
    `SELECT a.*, c.instructor_id, c.title AS course_title, c.status AS course_status
     FROM assignments a
     JOIN courses c ON c.id = a.course_id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.create = async ({ course_id, title, description, due_at, max_score }) => {
  const [result] = await db.query(
    `INSERT INTO assignments (course_id, title, description, due_at, max_score)
     VALUES (?, ?, ?, ?, ?)`,
    [course_id, title, description, due_at, max_score]
  );
  return result.insertId;
};

exports.update = async (id, { title, description, due_at, max_score }) => {
  await db.query(
    'UPDATE assignments SET title = ?, description = ?, due_at = ?, max_score = ? WHERE id = ?',
    [title, description, due_at, max_score, id]
  );
};

exports.remove = async (id) => {
  await db.query('DELETE FROM assignments WHERE id = ?', [id]);
};
