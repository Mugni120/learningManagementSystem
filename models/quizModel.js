const db = require('../config/db');

const attachQuestions = async (quiz) => {
  if (!quiz) return null;
  const [questions] = await db.query(
    'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position',
    [quiz.id]
  );
  const [options] = await db.query(
    `SELECT o.* FROM quiz_options o
     JOIN quiz_questions q ON q.id = o.question_id
     WHERE q.quiz_id = ?
     ORDER BY q.position, o.position`,
    [quiz.id]
  );
  quiz.questions = questions.map((q) => ({
    ...q,
    options: options.filter((o) => o.question_id === q.id),
  }));
  return quiz;
};

exports.findByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT q.*,
       (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count
     FROM quizzes q
     WHERE q.course_id = ?
     ORDER BY q.created_at`,
    [courseId]
  );
  return rows;
};

exports.findByIdWithCourse = async (id) => {
  const [rows] = await db.query(
    `SELECT q.*, c.instructor_id, c.title AS course_title, c.status AS course_status
     FROM quizzes q
     JOIN courses c ON c.id = q.course_id
     WHERE q.id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.findTreeById = async (id) => {
  const [rows] = await db.query(
    `SELECT q.*, c.instructor_id, c.title AS course_title, c.status AS course_status
     FROM quizzes q
     JOIN courses c ON c.id = q.course_id
     WHERE q.id = ?`,
    [id]
  );
  return attachQuestions(rows[0] || null);
};

exports.create = async ({ course_id, title, description, time_limit_minutes, passing_score, max_attempts }) => {
  const [result] = await db.query(
    `INSERT INTO quizzes (course_id, title, description, time_limit_minutes, passing_score, max_attempts)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [course_id, title, description, time_limit_minutes, passing_score, max_attempts]
  );
  return result.insertId;
};

exports.update = async (id, { title, description, time_limit_minutes, passing_score, max_attempts }) => {
  await db.query(
    `UPDATE quizzes SET title = ?, description = ?, time_limit_minutes = ?, passing_score = ?, max_attempts = ?
     WHERE id = ?`,
    [title, description, time_limit_minutes, passing_score, max_attempts, id]
  );
};

exports.remove = async (id) => {
  await db.query('DELETE FROM quizzes WHERE id = ?', [id]);
};
