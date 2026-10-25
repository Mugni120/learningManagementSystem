const db = require('../config/db');
const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { flashMessage } = require('../utils/helpers');

exports.edit = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.session.user.id);
    if (!user) {
      req.session.destroy(() => res.redirect('/login'));
      return;
    }
    res.render('profile/edit', {
      title: 'Edit Profile',
      user,
      msg: flashMessage(req),
      errors: [],
      old: { full_name: user.full_name || '', email: user.email || '' },
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { full_name, email } = req.body;
    const errors = [];
    if (!full_name || !full_name.trim()) errors.push('Nama lengkap wajib diisi.');
    if (!email || !email.trim()) errors.push('Email wajib diisi.');
    const userId = req.session.user.id;
    const existing = await userModel.findByEmail(email.trim());
    if (existing && existing.id !== userId) errors.push('Email sudah digunakan user lain.');
    if (errors.length) {
      return res.status(422).render('profile/edit', {
        title: 'Edit Profile',
        user: await userModel.findById(userId),
        errors,
        old: { full_name: full_name || '', email: email || '' },
      });
    }
    await db.query(
      'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
      [full_name.trim(), email.trim(), userId]
    );
    req.session.user.full_name = full_name.trim();
    req.session.user.email = email.trim();
    res.redirect('/profile?msg=updated');
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const errors = [];
    const user = await userModel.findByEmail(req.session.user.email);
    if (!user || !(await bcrypt.compare(current_password || '', user.password_hash))) {
      errors.push('Password saat ini salah.');
    }
    if (!new_password || new_password.length < 6) errors.push('Password baru minimal 6 karakter.');
    if (new_password !== confirm_password) errors.push('Konfirmasi password tidak cocok.');
    if (errors.length) {
      return res.status(422).render('profile/password', {
        title: 'Ubah Password',
        errors,
        msg: null,
      });
    }
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.session.user.id]);
    res.redirect('/profile?msg=password-changed');
  } catch (err) {
    next(err);
  }
};
