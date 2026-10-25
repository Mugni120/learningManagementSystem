const courseModel = require('../models/courseModel');
const moduleModel = require('../models/moduleModel');
const lessonModel = require('../models/lessonModel');
const categoryModel = require('../models/categoryModel');
const enrollmentModel = require('../models/enrollmentModel');
const { slugify, flashMessage } = require('../utils/helpers');

const LEVELS = ['beginner', 'intermediate', 'advanced'];

const notFound = () => {
  const err = new Error('Data tidak ditemukan.');
  err.status = 404;
  return err;
};

const ownCourse = async (req, courseId) => {
  const course = await courseModel.findById(courseId);
  if (!course || course.instructor_id !== req.session.user.id) throw notFound();
  return course;
};

const ownModule = async (req, moduleId) => {
  const mod = await moduleModel.findById(moduleId);
  if (!mod) throw notFound();
  await ownCourse(req, mod.course_id);
  return mod;
};

const ownLesson = async (req, lessonId) => {
  const lesson = await lessonModel.findByIdWithCourse(lessonId);
  if (!lesson) throw notFound();
  if (lesson.instructor_id !== req.session.user.id) throw notFound();
  return lesson;
};

const validateCourse = (body) => {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('Judul course wajib diisi.');
  if (!LEVELS.includes(body.level)) errors.push('Level tidak valid.');
  return errors;
};

const validateLesson = (body) => {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('Judul lesson wajib diisi.');
  const duration = Number(body.duration_minutes);
  if (!Number.isInteger(duration) || duration < 0) errors.push('Durasi harus angka menit >= 0.');
  return errors;
};

exports.index = async (req, res, next) => {
  try {
    const courses = await courseModel.findByInstructor(req.session.user.id);
    res.render('instructor/courses/index', {
      title: 'My Courses',
      courses,
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = async (req, res, next) => {
  try {
    res.render('instructor/courses/form', {
      title: 'Course Baru',
      categories: await categoryModel.findAll(),
      course: null,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validateCourse(req.body);
    const categories = await categoryModel.findAll();
    if (errors.length) {
      return res.status(422).render('instructor/courses/form', {
        title: 'Course Baru',
        categories,
        course: req.body,
        errors,
      });
    }
    const slug = await courseModel.uniqueSlug(slugify(req.body.title));
    await courseModel.create({
      instructor_id: req.session.user.id,
      category_id: req.body.category_id ? Number(req.body.category_id) : null,
      title: req.body.title.trim(),
      slug,
      description: req.body.description || null,
      level: req.body.level,
      status: 'draft',
    });
    return res.redirect('/instructor/courses?msg=course-created');
  } catch (err) {
    next(err);
  }
};

exports.showEdit = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.params.id));
    res.render('instructor/courses/form', {
      title: 'Edit Course',
      categories: await categoryModel.findAll(),
      course,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.params.id));
    const errors = validateCourse(req.body);
    if (errors.length) {
      return res.status(422).render('instructor/courses/form', {
        title: 'Edit Course',
        categories: await categoryModel.findAll(),
        course: { ...course, ...req.body },
        errors,
      });
    }
    const slug = await courseModel.uniqueSlug(slugify(req.body.title), course.id);
    await courseModel.update(course.id, {
      category_id: req.body.category_id ? Number(req.body.category_id) : null,
      title: req.body.title.trim(),
      slug,
      description: req.body.description || null,
      level: req.body.level,
    });
    return res.redirect('/instructor/courses?msg=course-updated');
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.params.id));
    await courseModel.remove(course.id);
    res.redirect('/instructor/courses?msg=course-deleted');
  } catch (err) {
    next(err);
  }
};

exports.publish = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.params.id));
    await courseModel.setStatus(course.id, 'published');
    res.redirect('/instructor/courses?msg=course-published');
  } catch (err) {
    next(err);
  }
};

exports.unpublish = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.params.id));
    await courseModel.setStatus(course.id, 'draft');
    res.redirect('/instructor/courses?msg=course-unpublished');
  } catch (err) {
    next(err);
  }
};

exports.builder = async (req, res, next) => {
  try {
    const course = await courseModel.findTreeById(Number(req.params.id));
    if (!course || course.instructor_id !== req.session.user.id) throw notFound();
    res.render('instructor/courses/builder', {
      title: course.title,
      course,
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};

exports.addModule = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.params.id));
    const title = (req.body.title || '').trim();
    if (title) {
      await moduleModel.create(course.id, title);
      return res.redirect(`/instructor/courses/${course.id}?msg=module-created`);
    }
    return res.redirect(`/instructor/courses/${course.id}`);
  } catch (err) {
    next(err);
  }
};

exports.renameModule = async (req, res, next) => {
  try {
    const mod = await ownModule(req, Number(req.params.id));
    const title = (req.body.title || '').trim();
    if (title) {
      await moduleModel.rename(mod.id, title);
      return res.redirect(`/instructor/courses/${mod.course_id}?msg=module-updated`);
    }
    return res.redirect(`/instructor/courses/${mod.course_id}`);
  } catch (err) {
    next(err);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const mod = await ownModule(req, Number(req.params.id));
    await moduleModel.remove(mod.id);
    res.redirect(`/instructor/courses/${mod.course_id}?msg=module-deleted`);
  } catch (err) {
    next(err);
  }
};

exports.showLessonForm = async (req, res, next) => {
  try {
    const mod = await ownModule(req, Number(req.query.module));
    res.render('instructor/lessons/form', {
      title: 'Lesson Baru',
      module: mod,
      lesson: null,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
};

exports.createLesson = async (req, res, next) => {
  try {
    const mod = await ownModule(req, Number(req.body.module_id));
    const errors = validateLesson(req.body);
    if (errors.length) {
      return res.status(422).render('instructor/lessons/form', {
        title: 'Lesson Baru',
        module: mod,
        lesson: req.body,
        errors,
      });
    }
    await lessonModel.create({
      module_id: mod.id,
      title: req.body.title.trim(),
      content: req.body.content || null,
      video_url: req.body.video_url || null,
      duration_minutes: Number(req.body.duration_minutes),
      is_free_preview: req.body.is_free_preview === 'on',
    });
    return res.redirect(`/instructor/courses/${mod.course_id}?msg=lesson-created`);
  } catch (err) {
    next(err);
  }
};

exports.showLessonEdit = async (req, res, next) => {
  try {
    const lesson = await ownLesson(req, Number(req.params.id));
    const mod = await moduleModel.findById(lesson.module_id);
    res.render('instructor/lessons/form', {
      title: 'Edit Lesson',
      module: mod,
      lesson,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
};

exports.updateLesson = async (req, res, next) => {
  try {
    const lesson = await ownLesson(req, Number(req.params.id));
    const errors = validateLesson(req.body);
    if (errors.length) {
      const mod = await moduleModel.findById(lesson.module_id);
      return res.status(422).render('instructor/lessons/form', {
        title: 'Edit Lesson',
        module: mod,
        lesson: { ...lesson, ...req.body },
        errors,
      });
    }
    await lessonModel.update(lesson.id, {
      title: req.body.title.trim(),
      content: req.body.content || null,
      video_url: req.body.video_url || null,
      duration_minutes: Number(req.body.duration_minutes),
      is_free_preview: req.body.is_free_preview === 'on',
    });
    return res.redirect(`/instructor/courses/${lesson.course_id}?msg=lesson-updated`);
  } catch (err) {
    next(err);
  }
};

exports.deleteLesson = async (req, res, next) => {
  try {
    const lesson = await ownLesson(req, Number(req.params.id));
    await lessonModel.remove(lesson.id);
    res.redirect(`/instructor/courses/${lesson.course_id}?msg=lesson-deleted`);
  } catch (err) {
    next(err);
  }
};

exports.enrollments = async (req, res, next) => {
  try {
    const course = await ownCourse(req, Number(req.params.id));
    const enrollments = await enrollmentModel.findByCourse(course.id);
    res.render('instructor/enrollments', {
      title: 'Peserta Course',
      course,
      enrollments,
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};
