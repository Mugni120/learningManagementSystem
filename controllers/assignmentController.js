const courseModel = require('../models/courseModel');
const enrollmentModel = require('../models/enrollmentModel');
const assignmentModel = require('../models/assignmentModel');
const submissionModel = require('../models/submissionModel');
const { flashMessage, httpError } = require('../utils/helpers');

const parseDueAt = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw httpError(422, 'Format tanggal deadline tidak valid.');
  return date;
};

const validate = (body) => {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('Judul assignment wajib diisi.');
  const maxScore = Number(body.max_score);
  if (!Number.isFinite(maxScore) || maxScore <= 0) errors.push('Max score harus angka > 0.');
  return errors;
};

const ownCourse = async (req, courseId) => {
  const course = await courseModel.findById(courseId);
  if (!course || course.instructor_id !== req.session.user.id) throw httpError(404, 'Course tidak ditemukan.');
  return course;
};

const ownAssignment = async (req, id) => {
  const assignment = await assignmentModel.findByIdWithCourse(id);
  if (!assignment || assignment.instructor_id !== req.session.user.id) {
    throw httpError(404, 'Assignment tidak ditemukan.');
  }
  return assignment;
};

const assertEnrolled = async (req, courseId) => {
  const enrollment = await enrollmentModel.findByCourseAndStudent(courseId, req.session.user.id);
  if (!enrollment) throw httpError(403, 'Anda belum enroll ke course ini.');
  return enrollment;
};

exports.index = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.query.course));
    const assignments = await assignmentModel.findByCourse(course.id);
    res.render('assignments/index', { title: 'Assignments', course, assignments, msg: flashMessage(req) });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.query.course));
    res.render('assignments/form', { title: 'Assignment Baru', course, assignment: null, errors: [] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.body.course_id));
    const errors = validate(req.body);
    if (errors.length) {
      return res.status(422).render('assignments/form', { title: 'Assignment Baru', course, assignment: req.body, errors });
    }
    await assignmentModel.create({
      course_id: course.id,
      title: req.body.title.trim(),
      description: req.body.description || null,
      due_at: parseDueAt(req.body.due_at),
      max_score: Number(req.body.max_score),
    });
    return res.redirect(`/instructor/assignments?course=${course.id}&msg=assignment-created`);
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const assignment = await ownAssignment(req, Number(req.params.id));
    const course = await courseModel.findById(assignment.course_id);
    res.render('assignments/form', { title: 'Edit Assignment', course, assignment, errors: [] });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const assignment = await ownAssignment(req, Number(req.params.id));
    const errors = validate(req.body);
    if (errors.length) {
      const course = await courseModel.findById(assignment.course_id);
      return res.status(422).render('assignments/form', {
        title: 'Edit Assignment',
        course,
        assignment: { ...assignment, ...req.body },
        errors,
      });
    }
    await assignmentModel.update(assignment.id, {
      title: req.body.title.trim(),
      description: req.body.description || null,
      due_at: parseDueAt(req.body.due_at),
      max_score: Number(req.body.max_score),
    });
    return res.redirect(`/instructor/assignments?course=${assignment.course_id}&msg=assignment-updated`);
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const assignment = await ownAssignment(req, Number(req.params.id));
    await assignmentModel.remove(assignment.id);
    res.redirect(`/instructor/assignments?course=${assignment.course_id}&msg=assignment-deleted`);
  } catch (err) {
    next(err);
  }
};

exports.submissions = async (req, res, next) => {
  try {
    const assignment = await ownAssignment(req, Number(req.params.id));
    const submissions = await submissionModel.findByAssignment(assignment.id);
    res.render('assignments/submissions', { title: assignment.title, assignment, submissions, msg: flashMessage(req) });
  } catch (err) {
    next(err);
  }
};

exports.grade = async (req, res, next) => {
  try {
    const assignment = await ownAssignment(req, Number(req.body.assignment_id));
    const submission = await submissionModel.findByAssignmentAndStudent(
      assignment.id,
      Number(req.body.student_id)
    );
    if (!submission) throw httpError(404, 'Submission tidak ditemukan.');
    const score = Number(req.body.score);
    if (!Number.isFinite(score) || score < 0 || score > assignment.max_score) {
      throw httpError(422, `Score harus antara 0 dan ${assignment.max_score}.`);
    }
    await submissionModel.grade(submission.id, score, req.body.feedback || null, req.session.user.id);
    res.redirect(`/instructor/assignments/${assignment.id}/submissions?msg=submission-graded`);
  } catch (err) {
    next(err);
  }
};

exports.showStudent = async (req, res, next) => {
  try {
    const assignment = await assignmentModel.findByIdWithCourse(Number(req.params.id));
    if (!assignment || assignment.course_status !== 'published') {
      throw httpError(404, 'Assignment tidak ditemukan.');
    }
    await assertEnrolled(req, assignment.course_id);
    const submission = await submissionModel.findByAssignmentAndStudent(assignment.id, req.session.user.id);
    res.render('assignments/show', { title: assignment.title, assignment, submission, msg: flashMessage(req) });
  } catch (err) {
    next(err);
  }
};

exports.submit = async (req, res, next) => {
  try {
    const assignment = await assignmentModel.findByIdWithCourse(Number(req.params.id));
    if (!assignment || assignment.course_status !== 'published') {
      throw httpError(404, 'Assignment tidak ditemukan.');
    }
    await assertEnrolled(req, assignment.course_id);
    const submission = await submissionModel.findByAssignmentAndStudent(assignment.id, req.session.user.id);
    if (submission && submission.score !== null) {
      throw httpError(400, 'Submission sudah dinilai dan tidak dapat diubah.');
    }
    const content = (req.body.content || '').trim();
    if (!content) throw httpError(422, 'Jawaban tidak boleh kosong.');
    await submissionModel.submit(assignment.id, req.session.user.id, content);
    res.redirect(`/assignments/${assignment.id}?msg=submission-saved`);
  } catch (err) {
    next(err);
  }
};
