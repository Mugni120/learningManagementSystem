const db = require('../config/db');

exports.createWithOptions = async ({ quiz_id, question_text, question_type, points, options }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [posRows] = await conn.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM quiz_questions WHERE quiz_id = ?',
      [quiz_id]
    );
    const [qResult] = await conn.query(
      `INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, position)
       VALUES (?, ?, ?, ?, ?)`,
      [quiz_id, question_text, question_type, points, posRows[0].next_pos]
    );
    const questionId = qResult.insertId;
    if (question_type === 'multiple_choice' || question_type === 'true_false') {
      for (let i = 0; i < options.length; i += 1) {
        await conn.query(
          'INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES (?, ?, ?, ?)',
          [questionId, options[i].option_text, options[i].is_correct, i + 1]
        );
      }
    }
    await conn.commit();
    return questionId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM quiz_questions WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

exports.remove = async (id) => {
  await db.query('DELETE FROM quiz_questions WHERE id = ?', [id]);
};
