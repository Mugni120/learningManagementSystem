const courseModel = require('../models/courseModel');
const enrollmentModel = require('../models/enrollmentModel');
const progressModel = require('../models/progressModel');
const lessonModel = require('../models/lessonModel');
const assignmentModel = require('../models/assignmentModel');
const submissionModel = require('../models/submissionModel');
const quizModel = require('../models/quizModel');
const attemptModel = require('../models/attemptModel');
const { flashMessage, httpError } = require('../utils/helpers');

const assertEnrolled = async (req, courseId) => {
  const course = await courseModel.findTreeById(courseId);
  if (!course || course.status !== 'published') throw httpError(404, 'Course tidak ditemukan.');
  const enrollment = await enrollmentModel.findByCourseAndStudent(courseId, req.session.user.id);
  if (!enrollment) throw httpError(403, 'Anda belum enroll ke course ini.');
  return { course, enrollment };
};

exports.enroll = async (req, res, next) => {
  try {
    const course = await courseModel.findPublishedTreeBySlug(req.params.slug);
    if (!course) throw httpError(404, 'Course tidak ditemukan.');
    const existing = await enrollmentModel.findByCourseAndStudent(course.id, req.session.user.id);
    if (!existing) await enrollmentModel.create(course.id, req.session.user.id);
    res.redirect(`/learn/${course.id}?msg=enrolled`);
  } catch (err) {
    next(err);
  }
};

exports.coursePlayer = async (req, res, next) => {
  try {
    const { course, enrollment } = await assertEnrolled(req, Number(req.params.courseId));
    const completed = await progressModel.completedLessonIds(enrollment.id);
    const percent = await progressModel.percent(enrollment.id, course.id);
    const assignments = await assignmentModel.findByCourse(course.id);
    const mySubs = await submissionModel.findGradedByCourseAndStudent(course.id, req.session.user.id);
    const subByAssignment = new Map(mySubs.map((s) => [s.assignment_id, s]));
    const quizzes = await quizModel.findByCourse(course.id);
    const bestScores = await attemptModel.bestScoreByCourseStudent(course.id, req.session.user.id);
    const attemptsLeft = new Map();
    for (const quiz of quizzes) {
      const used = await attemptModel.countSubmittedByQuizStudent(quiz.id, req.session.user.id);
      attemptsLeft.set(quiz.id, Math.max(0, quiz.max_attempts - used));
    }
    res.render('learn/course', {
      title: course.title,
      course,
      enrollment,
      completed,
      percent,
      assignments,
      subByAssignment,
      quizzes,
      bestScores,
      attemptsLeft,
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};

exports.lessonView = async (req, res, next) => {
  try {
    const { course, enrollment } = await assertEnrolled(req, Number(req.params.courseId));
    const lesson = await lessonModel.findByIdWithCourse(Number(req.params.lessonId));
    if (!lesson || lesson.course_id !== course.id) throw httpError(404, 'Lesson tidak ditemukan.');
    const completed = await progressModel.completedLessonIds(enrollment.id);
    const percent = await progressModel.percent(enrollment.id, course.id);
    res.render('learn/lesson', {
      title: lesson.title,
      course,
      lesson,
      enrollment,
      completed,
      percent,
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};

exports.markComplete = async (req, res, next) => {
  try {
    const { course, enrollment } = await assertEnrolled(req, Number(req.params.courseId));
    const lesson = await lessonModel.findByIdWithCourse(Number(req.params.lessonId));
    if (!lesson || lesson.course_id !== course.id) throw httpError(404, 'Lesson tidak ditemukan.');
    await progressModel.markComplete(enrollment.id, lesson.id);
    const percent = await progressModel.percent(enrollment.id, course.id);
    if (percent === 100 && enrollment.status !== 'completed') {
      await enrollmentModel.markCompleted(enrollment.id);
    }
    res.redirect(`/learn/${course.id}/lessons/${lesson.id}?msg=lesson-completed`);
  } catch (err) {
    next(err);
  }
};

exports.certificate = async (req, res, next) => {
  try {
    const { course, enrollment } = await assertEnrolled(req, Number(req.params.courseId));
    const percent = await progressModel.percent(enrollment.id, course.id);
    if (percent < 100) {
      const err = new Error('Anda belum menyelesaikan seluruh lesson course ini.');
      err.status = 403;
      throw err;
    }
    res.render('learn/certificate', {
      title: 'Sertifikat',
      course,
      enrollment,
      student: req.session.user,
      percent,
    });
  } catch (err) {
    next(err);
  }
};
