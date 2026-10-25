const db = require('../config/db');

exports.countSubmittedByQuizStudent = async (quizId, studentId) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? AND submitted_at IS NOT NULL',
    [quizId, studentId]
  );
  return rows[0].total;
};

exports.createWithAnswers = async ({ quiz_id, student_id, score, passed, answers }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [aResult] = await conn.query(
      `INSERT INTO quiz_attempts (quiz_id, student_id, submitted_at, score, passed)
       VALUES (?, ?, NOW(), ?, ?)`,
      [quiz_id, student_id, score, passed]
    );
    const attemptId = aResult.insertId;
    for (const answer of answers) {
      await conn.query(
        `INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, is_correct, points_earned)
         VALUES (?, ?, ?, ?, ?)`,
        [attemptId, answer.question_id, answer.selected_option_id, answer.is_correct, answer.points_earned]
      );
    }
    await conn.commit();
    return attemptId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.findLatestByQuizStudent = async (quizId, studentId) => {
  const [rows] = await db.query(
    `SELECT * FROM quiz_attempts
     WHERE quiz_id = ? AND student_id = ? AND submitted_at IS NOT NULL
     ORDER BY submitted_at DESC
     LIMIT 1`,
    [quizId, studentId]
  );
  return rows[0] || null;
};

exports.findWithAnswers = async (attemptId) => {
  const [rows] = await db.query(
    `SELECT t.*, q.title AS quiz_title, q.passing_score, u.full_name AS student_name
     FROM quiz_attempts t
     JOIN quizzes q ON q.id = t.quiz_id
     JOIN users u ON u.id = t.student_id
     WHERE t.id = ?`,
    [attemptId]
  );
  const attempt = rows[0] || null;
  if (!attempt) return null;
  const [answers] = await db.query(
    `SELECT a.*, qq.question_text, qq.points AS question_points,
            o.option_text AS selected_option_text
     FROM quiz_answers a
     JOIN quiz_questions qq ON qq.id = a.question_id
     LEFT JOIN quiz_options o ON o.id = a.selected_option_id
     WHERE a.attempt_id = ?
     ORDER BY qq.position`,
    [attemptId]
  );
  attempt.answers = answers;
  return attempt;
};

exports.findByQuiz = async (quizId) => {
  const [rows] = await db.query(
    `SELECT t.*, u.full_name AS student_name, u.email AS student_email
     FROM quiz_attempts t
     JOIN users u ON u.id = t.student_id
     WHERE t.quiz_id = ? AND t.submitted_at IS NOT NULL
     ORDER BY t.submitted_at DESC`,
    [quizId]
  );
  return rows;
};

exports.bestScoreByCourseStudent = async (courseId, studentId) => {
  const [rows] = await db.query(
    `SELECT t.quiz_id, MAX(t.score) AS best_score
     FROM quiz_attempts t
     JOIN quizzes q ON q.id = t.quiz_id
     WHERE q.course_id = ? AND t.student_id = ? AND t.submitted_at IS NOT NULL
     GROUP BY t.quiz_id`,
    [courseId, studentId]
  );
  return new Map(rows.map((r) => [r.quiz_id, r.best_score]));
};
