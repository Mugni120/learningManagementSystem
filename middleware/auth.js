exports.requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

exports.requireGuest = (req, res, next) => {
  if (req.session.user) return res.redirect('/dashboard');
  next();
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  if (!roles.includes(req.session.user.role)) {
    const err = new Error('Anda tidak memiliki akses ke halaman ini.');
    err.status = 403;
    return next(err);
  }
  next();
};
