const db = require('../config/db');

exports.findByCourseAndStudent = async (courseId, studentId) => {
  const [rows] = await db.query(
    'SELECT * FROM enrollments WHERE course_id = ? AND student_id = ? LIMIT 1',
    [courseId, studentId]
  );
  return rows[0] || null;
};

exports.create = async (courseId, studentId) => {
  const [result] = await db.query(
    'INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)',
    [courseId, studentId]
  );
  return result.insertId;
};

exports.findByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT e.*, c.title AS course_title, c.slug AS course_slug,
            u.full_name AS instructor_name,
            COUNT(DISTINCT l.id) AS lesson_total,
            COUNT(DISTINCT CASE WHEN lp.is_completed = 1 THEN lp.lesson_id END) AS lesson_done
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN users u ON u.id = c.instructor_id
     LEFT JOIN modules m ON m.course_id = c.id
     LEFT JOIN lessons l ON l.module_id = m.id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = e.id
     WHERE e.student_id = ?
     GROUP BY e.id, c.id, u.id
     ORDER BY e.enrolled_at DESC`,
    [studentId]
  );
  return rows;
};

exports.markCompleted = async (id) => {
  await db.query(
    "UPDATE enrollments SET status = 'completed', completed_at = NOW() WHERE id = ?",
    [id]
  );
};

exports.findByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT e.*, u.full_name AS student_name, u.email AS student_email,
            COUNT(DISTINCT CASE WHEN lp.is_completed = 1 THEN lp.lesson_id END) AS lesson_done,
            COUNT(DISTINCT l.id) AS lesson_total
     FROM enrollments e
     JOIN users u ON u.id = e.student_id
     LEFT JOIN modules m ON m.course_id = ?
     LEFT JOIN lessons l ON l.module_id = m.id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = e.id
     WHERE e.course_id = ?
     GROUP BY e.id, u.id
     ORDER BY e.enrolled_at DESC`,
    [courseId, courseId]
  );
  return rows;
};
