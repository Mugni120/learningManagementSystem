const courseModel = require('../models/courseModel');
const enrollmentModel = require('../models/enrollmentModel');

exports.index = async (req, res, next) => {
  try {
    const courses = await courseModel.findPublishedCatalog();
    res.render('courses/index', { title: 'Katalog Course', courses });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const course = await courseModel.findPublishedTreeBySlug(req.params.slug);
    if (!course) {
      const err = new Error('Course tidak ditemukan.');
      err.status = 404;
      throw err;
    }
    const enrollment =
      req.session.user && req.session.user.role === 'student'
        ? await enrollmentModel.findByCourseAndStudent(course.id, req.session.user.id)
        : null;
    res.render('courses/show', { title: course.title, course, enrollment });
  } catch (err) {
    next(err);
  }
};
