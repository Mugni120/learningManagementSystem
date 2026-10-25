const courseModel = require('../models/courseModel');
const enrollmentModel = require('../models/enrollmentModel');
const quizModel = require('../models/quizModel');
const questionModel = require('../models/questionModel');
const attemptModel = require('../models/attemptModel');
const { flashMessage, httpError } = require('../utils/helpers');

const QUESTION_TYPES = ['multiple_choice', 'true_false'];

const ownCourse = async (req, courseId) => {
  const course = await courseModel.findById(courseId);
  if (!course || course.instructor_id !== req.session.user.id) throw httpError(404, 'Course tidak ditemukan.');
  return course;
};

const ownQuiz = async (req, id) => {
  const quiz = await quizModel.findByIdWithCourse(id);
  if (!quiz || quiz.instructor_id !== req.session.user.id) throw httpError(404, 'Quiz tidak ditemukan.');
  return quiz;
};

const assertEnrolled = async (req, courseId) => {
  const enrollment = await enrollmentModel.findByCourseAndStudent(courseId, req.session.user.id);
  if (!enrollment) throw httpError(403, 'Anda belum enroll ke course ini.');
  return enrollment;
};

const validateQuiz = (body) => {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('Judul quiz wajib diisi.');
  const passing = Number(body.passing_score);
  if (!Number.isFinite(passing) || passing < 0 || passing > 100) errors.push('Passing score harus 0-100.');
  const attempts = Number(body.max_attempts);
  if (!Number.isInteger(attempts) || attempts < 1) errors.push('Max attempts minimal 1.');
  if (body.time_limit_minutes) {
    const limit = Number(body.time_limit_minutes);
    if (!Number.isInteger(limit) || limit < 1) errors.push('Time limit harus angka menit >= 1.');
  }
  return errors;
};

exports.index = async (req, res, next) => {
  try {
    const courseId = Number(req.query.course);
    if (!courseId) {
      return res.redirect('/instructor/courses?msg=pilih-course-terlebih-dahulu');
    }
    const course = await ownCourse(req, courseId);
    const quizzes = await quizModel.findByCourse(course.id);
    res.render('quizzes/index', { title: 'Quizzes', course, quizzes, msg: flashMessage(req) });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.query.course));
    res.render('quizzes/form', { title: 'Quiz Baru', course, quiz: null, errors: [] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.body.course_id));
    const errors = validateQuiz(req.body);
    if (errors.length) {
      return res.status(422).render('quizzes/form', { title: 'Quiz Baru', course, quiz: req.body, errors });
    }
    await quizModel.create({
      course_id: course.id,
      title: req.body.title.trim(),
      description: req.body.description || null,
      time_limit_minutes: req.body.time_limit_minutes ? Number(req.body.time_limit_minutes) : null,
      passing_score: Number(req.body.passing_score),
      max_attempts: Number(req.body.max_attempts),
    });
    return res.redirect(`/instructor/quizzes?course=${course.id}&msg=quiz-created`);
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const quiz = await quizModel.findTreeById(Number(req.params.id));
    if (!quiz || quiz.instructor_id !== req.session.user.id) throw httpError(404, 'Quiz tidak ditemukan.');
    res.render('quizzes/show', { title: quiz.title, quiz, msg: flashMessage(req) });
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const quiz = await ownQuiz(req, Number(req.params.id));
    const course = await courseModel.findById(quiz.course_id);
    res.render('quizzes/form', { title: 'Edit Quiz', course, quiz, errors: [] });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const quiz = await ownQuiz(req, Number(req.params.id));
    const errors = validateQuiz(req.body);
    if (errors.length) {
      const course = await courseModel.findById(quiz.course_id);
      return res.status(422).render('quizzes/form', { title: 'Edit Quiz', course, quiz: { ...quiz, ...req.body }, errors });
    }
    await quizModel.update(quiz.id, {
      title: req.body.title.trim(),
      description: req.body.description || null,
      time_limit_minutes: req.body.time_limit_minutes ? Number(req.body.time_limit_minutes) : null,
      passing_score: Number(req.body.passing_score),
      max_attempts: Number(req.body.max_attempts),
    });
    return res.redirect(`/instructor/quizzes?course=${quiz.course_id}&msg=quiz-updated`);
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const quiz = await ownQuiz(req, Number(req.params.id));
    await quizModel.remove(quiz.id);
    res.redirect(`/instructor/quizzes?course=${quiz.course_id}&msg=quiz-deleted`);
  } catch (err) {
    next(err);
  }
};

exports.addQuestion = async (req, res, next) => {
  try {
    const quiz = await ownQuiz(req, Number(req.params.id));
    const type = req.body.question_type;
    const points = Number(req.body.points);
    const errors = [];
    if (!req.body.question_text || !req.body.question_text.trim()) errors.push('Teks pertanyaan wajib diisi.');
    if (!QUESTION_TYPES.includes(type)) errors.push('Tipe pertanyaan tidak valid.');
    if (!Number.isFinite(points) || points <= 0) errors.push('Points harus angka > 0.');

    let options = [];
    if (type === 'multiple_choice') {
      const texts = req.body.option_text || [];
      const list = Array.isArray(texts) ? texts : [texts];
      const filled = list.map((t) => (t || '').trim()).filter(Boolean);
      if (filled.length < 2) errors.push('Multiple choice butuh minimal 2 opsi.');
      const correctIndex = Number(req.body.correct_index);
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= filled.length) {
        errors.push('Pilih kunci jawaban yang valid.');
      }
      options = filled.map((text, i) => ({ option_text: text, is_correct: i === correctIndex }));
    } else if (type === 'true_false') {
      const correct = Number(req.body.correct_tf);
      if (correct !== 0 && correct !== 1) errors.push('Pilih kunci jawaban True/False.');
      options = [
        { option_text: 'True', is_correct: correct === 0 },
        { option_text: 'False', is_correct: correct === 1 },
      ];
    }

    if (errors.length) {
      const tree = await quizModel.findTreeById(quiz.id);
      return res.status(422).render('quizzes/show', { title: quiz.title, quiz: tree, errors, msg: null });
    }
    await questionModel.createWithOptions({
      quiz_id: quiz.id,
      question_text: req.body.question_text.trim(),
      question_type: type,
      points,
      options,
    });
    return res.redirect(`/instructor/quizzes/${quiz.id}?msg=question-added`);
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await questionModel.findById(Number(req.params.id));
    if (!question) throw httpError(404, 'Pertanyaan tidak ditemukan.');
    await ownQuiz(req, question.quiz_id);
    await questionModel.remove(question.id);
    res.redirect(`/instructor/quizzes/${question.quiz_id}?msg=question-deleted`);
  } catch (err) {
    next(err);
  }
};

exports.attempts = async (req, res, next) => {
  try {
    const quiz = await ownQuiz(req, Number(req.params.id));
    const attempts = await attemptModel.findByQuiz(quiz.id);
    res.render('quizzes/attempts', { title: quiz.title, quiz, attempts });
  } catch (err) {
    next(err);
  }
};

exports.take = async (req, res, next) => {
  try {
    const quiz = await quizModel.findTreeById(Number(req.params.id));
    if (!quiz || quiz.course_status !== 'published') throw httpError(404, 'Quiz tidak ditemukan.');
    await assertEnrolled(req, quiz.course_id);
    const used = await attemptModel.countSubmittedByQuizStudent(quiz.id, req.session.user.id);
    const attemptsLeft = quiz.max_attempts - used;
    if (attemptsLeft <= 0) {
      return res.redirect(`/quizzes/${quiz.id}/result`);
    }
    const safeQuestions = quiz.questions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      options: q.options.map((o) => ({ id: o.id, option_text: o.option_text })),
    }));
    return res.render('quizzes/take', {
      title: quiz.title,
      quiz,
      questions: safeQuestions,
      attemptsLeft,
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};

exports.submitAttempt = async (req, res, next) => {
  try {
    const quiz = await quizModel.findTreeById(Number(req.params.id));
    if (!quiz || quiz.course_status !== 'published') throw httpError(404, 'Quiz tidak ditemukan.');
    await assertEnrolled(req, quiz.course_id);
    const used = await attemptModel.countSubmittedByQuizStudent(quiz.id, req.session.user.id);
    if (quiz.max_attempts - used <= 0) throw httpError(400, 'Kesempatan mengerjakan quiz sudah habis.');

    let earned = 0;
    let totalPoints = 0;
    const answers = [];
    for (const question of quiz.questions) {
      totalPoints += Number(question.points);
      const selectedId = req.body[`q_${question.id}`] ? Number(req.body[`q_${question.id}`]) : null;
      const selectedOption = question.options.find((o) => o.id === selectedId) || null;
      const isCorrect = selectedOption ? Boolean(selectedOption.is_correct) : false;
      const pointsEarned = isCorrect ? Number(question.points) : 0;
      earned += pointsEarned;
      answers.push({
        question_id: question.id,
        selected_option_id: selectedId,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      });
    }
    const score = totalPoints ? Math.round((earned / totalPoints) * 10000) / 100 : 0;
    const passed = score >= Number(quiz.passing_score);
    const attemptId = await attemptModel.createWithAnswers({
      quiz_id: quiz.id,
      student_id: req.session.user.id,
      score,
      passed,
      answers,
    });
    res.redirect(`/quizzes/${quiz.id}/result?msg=attempt-submitted#a-${attemptId}`);
  } catch (err) {
    next(err);
  }
};

exports.result = async (req, res, next) => {
  try {
    const quiz = await quizModel.findByIdWithCourse(Number(req.params.id));
    if (!quiz || quiz.course_status !== 'published') throw httpError(404, 'Quiz tidak ditemukan.');
    await assertEnrolled(req, quiz.course_id);
    const attempt = await attemptModel.findLatestByQuizStudent(quiz.id, req.session.user.id);
    const detail = attempt ? await attemptModel.findWithAnswers(attempt.id) : null;
    const used = await attemptModel.countSubmittedByQuizStudent(quiz.id, req.session.user.id);
    res.render('quizzes/result', {
      title: quiz.title,
      quiz,
      attempt: detail,
      attemptsLeft: Math.max(0, quiz.max_attempts - used),
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};
