const db = require('../config/db');

exports.findByAssignment = async (assignmentId) => {
  const [rows] = await db.query(
    `SELECT s.*, u.full_name AS student_name, u.email AS student_email
     FROM submissions s
     JOIN users u ON u.id = s.student_id
     WHERE s.assignment_id = ?
     ORDER BY s.submitted_at`,
    [assignmentId]
  );
  return rows;
};

exports.findByAssignmentAndStudent = async (assignmentId, studentId) => {
  const [rows] = await db.query(
    'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1',
    [assignmentId, studentId]
  );
  return rows[0] || null;
};

exports.findGradedByCourseAndStudent = async (courseId, studentId) => {
  const [rows] = await db.query(
    `SELECT s.*, a.title AS assignment_title, a.max_score
     FROM submissions s
     JOIN assignments a ON a.id = s.assignment_id
     WHERE a.course_id = ? AND s.student_id = ?`,
    [courseId, studentId]
  );
  return rows;
};

exports.submit = async (assignmentId, studentId, content) => {
  const existing = await exports.findByAssignmentAndStudent(assignmentId, studentId);
  if (existing) {
    await db.query(
      'UPDATE submissions SET content = ?, submitted_at = NOW() WHERE id = ?',
      [content, existing.id]
    );
    return existing.id;
  }
  const [result] = await db.query(
    'INSERT INTO submissions (assignment_id, student_id, content) VALUES (?, ?, ?)',
    [assignmentId, studentId, content]
  );
  return result.insertId;
};

exports.grade = async (id, score, feedback, graderId) => {
  await db.query(
    'UPDATE submissions SET score = ?, feedback = ?, graded_by = ?, graded_at = NOW() WHERE id = ?',
    [score, feedback, graderId, id]
  );
};
