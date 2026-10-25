const db = require('../config/db');

exports.completedLessonIds = async (enrollmentId) => {
  const [rows] = await db.query(
    'SELECT lesson_id FROM lesson_progress WHERE enrollment_id = ? AND is_completed = 1',
    [enrollmentId]
  );
  return new Set(rows.map((r) => r.lesson_id));
};

exports.markComplete = async (enrollmentId, lessonId) => {
  await db.query(
    `INSERT INTO lesson_progress (enrollment_id, lesson_id, is_completed, completed_at)
     VALUES (?, ?, 1, NOW())
     ON DUPLICATE KEY UPDATE is_completed = 1, completed_at = NOW()`,
    [enrollmentId, lessonId]
  );
};

exports.percent = async (enrollmentId, courseId) => {
  const [totals] = await db.query(
    'SELECT COUNT(*) AS total FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?',
    [courseId]
  );
  const [dones] = await db.query(
    `SELECT COUNT(*) AS done FROM lesson_progress lp
     JOIN lessons l ON l.id = lp.lesson_id
     JOIN modules m ON m.id = l.module_id
     WHERE lp.enrollment_id = ? AND lp.is_completed = 1 AND m.course_id = ?`,
    [enrollmentId, courseId]
  );
  const total = totals[0].total;
  return total ? Math.round((dones[0].done / total) * 100) : 0;
};
