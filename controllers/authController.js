const bcrypt = require('bcryptjs');
const user = require('../models/userModel');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toSessionUser = (row) => ({
  id: row.id,
  full_name: row.full_name,
  email: row.email,
  role: row.role_name,
});

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Login', error: null });
};

exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Register', errors: [], old: {} });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const row = await user.findByEmail((email || '').trim());
    const passwordOk = row && (await bcrypt.compare(password || '', row.password_hash));
    if (!row || !passwordOk) {
      return res.status(401).render('auth/login', { title: 'Login', error: 'Email atau password salah.' });
    }
    if (!row.is_active) {
      return res.status(403).render('auth/login', { title: 'Login', error: 'Akun nonaktif. Hubungi administrator.' });
    }
    req.session.user = toSessionUser(row);
    return res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, password_confirm } = req.body;
    const old = { full_name: full_name || '', email: email || '' };
    const errors = [];
    if (!full_name || !full_name.trim()) errors.push('Nama lengkap wajib diisi.');
    if (!EMAIL_RE.test(email || '')) errors.push('Format email tidak valid.');
    if (!password || password.length < 8) errors.push('Password minimal 8 karakter.');
    if (password !== password_confirm) errors.push('Konfirmasi password tidak cocok.');
    if (!errors.length && (await user.emailExists((email || '').trim()))) {
      errors.push('Email sudah terdaftar.');
    }
    if (errors.length) {
      return res.status(422).render('auth/register', { title: 'Register', errors, old });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await user.create({
      role_id: 3,
      full_name: full_name.trim(),
      email: email.trim(),
      password_hash: passwordHash,
    });
    const row = await user.findByEmail(email.trim());
    req.session.user = toSessionUser(row);
    return res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};
