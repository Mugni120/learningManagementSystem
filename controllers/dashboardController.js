const db = require('../config/db');
const userModel = require('../models/userModel');
const courseModel = require('../models/courseModel');
const enrollmentModel = require('../models/enrollmentModel');

exports.home = async (req, res, next) => {
  try {
    const role = req.session.user.role;
    if (role === 'student') {
      const enrollments = await enrollmentModel.findByStudent(req.session.user.id);
      enrollments.forEach((e) => {
        e.percent = e.lesson_total ? Math.round((e.lesson_done / e.lesson_total) * 100) : 0;
      });
      return res.render('dashboard/home', { title: 'Dashboard', role, enrollments, courses: null, stats: null });
    }
    if (role === 'instructor') {
      const courses = await courseModel.findByInstructor(req.session.user.id);
      return res.render('dashboard/home', { title: 'Dashboard', role, enrollments: null, courses, stats: null });
    }
    const [enrollmentRows] = await db.query('SELECT COUNT(*) AS total FROM enrollments');
    return res.render('dashboard/home', {
      title: 'Dashboard',
      role,
      enrollments: null,
      courses: null,
      stats: {
        users: await userModel.countAll(),
        courses: await courseModel.stats(),
        enrollments: enrollmentRows[0].total,
      },
    });
  } catch (err) {
    next(err);
  }
};
