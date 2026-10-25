exports.notFound = (req, res) => {
  res.status(404).render('error', { status: 404, message: 'Halaman tidak ditemukan.', title: 'Error' });
};

exports.errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const message = status >= 500 ? 'Terjadi kesalahan pada server.' : err.message;
  res.status(status).render('error', { status, message, title: 'Error' });
};
