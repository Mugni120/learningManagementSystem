const db = require('../config/db');
const userModel = require('../models/userModel');
const courseModel = require('../models/courseModel');
const { flashMessage } = require('../utils/helpers');

const VALID_ROLE_IDS = [1, 2, 3];

exports.home = async (req, res, next) => {
  try {
    const [enrollmentRows] = await db.query('SELECT COUNT(*) AS total FROM enrollments');
    res.render('admin/home', {
      title: 'Admin',
      stats: {
        users: await userModel.countAll(),
        courses: await courseModel.stats(),
        enrollments: enrollmentRows[0].total,
      },
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};

exports.users = async (req, res, next) => {
  try {
    const [roles] = await db.query('SELECT * FROM roles ORDER BY id');
    res.render('admin/users', {
      title: 'Manajemen User',
      users: await userModel.findAllWithRoles(),
      roles,
      msg: flashMessage(req),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    const target = await userModel.findById(targetId);
    if (!target) {
      const err = new Error('User tidak ditemukan.');
      err.status = 404;
      throw err;
    }
    if (targetId === req.session.user.id) {
      const err = new Error('Tidak dapat mengubah role atau status akun sendiri.');
      err.status = 400;
      throw err;
    }
    const roleId = Number(req.body.role_id);
    if (!VALID_ROLE_IDS.includes(roleId)) {
      const err = new Error('Role tidak valid.');
      err.status = 400;
      throw err;
    }
    await userModel.setRole(targetId, roleId);
    await userModel.setActive(targetId, req.body.is_active === '1');
    res.redirect('/admin/users?msg=user-updated');
  } catch (err) {
    next(err);
  }
};

exports.courses = async (req, res, next) => {
  try {
    res.render('admin/courses', {
      title: 'Semua Course',
      courses: await courseModel.findAllForAdmin(),
    });
  } catch (err) {
    next(err);
  }
};

exports.destroyUser = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    const target = await userModel.findById(targetId);
    if (!target) {
      const err = new Error('User tidak ditemukan.');
      err.status = 404;
      throw err;
    }
    if (targetId === req.session.user.id) {
      const err = new Error('Tidak dapat menghapus akun sendiri.');
      err.status = 400;
      throw err;
    }
    await userModel.remove(targetId);
    res.redirect('/admin/users?msg=user-deleted');
  } catch (err) {
    next(err);
  }
};
