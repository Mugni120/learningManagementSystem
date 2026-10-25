require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminCategoryRoutes = require('./routes/adminCategoryRoutes');
const learnRoutes = require('./routes/learnRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const sessionMaxAgeMs = 1000 * 60 * 60 * 8;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
if (isProduction) app.enable('view cache');
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: { 'img-src': ["'self'", 'data:'], 'connect-src': ["'self'"] },
    },
  })
);
app.use(compression());
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: isProduction ? '7d' : 0,
    etag: true,
  })
);
// Halaman HTML bergantung session (auth/dashboard) tidak boleh tersimpan di cache bersama.
app.use((req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});

app.use(
  session({
    name: 'lms.sid',
    secret: process.env.SESSION_SECRET,
    store: new MySQLStore(
      { createDatabaseTable: true, clearExpired: true, checkExpirationInterval: 15 * 60 * 1000, expiration: sessionMaxAgeMs },
      db
    ),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: sessionMaxAgeMs,
    },
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
});
app.use('/login', authLimiter);
app.use('/register', authLimiter);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.get('/healthz', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', uptime_seconds: Math.round(process.uptime()) });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', reason: err.code || 'db_unreachable' });
  }
});

app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', instructorRoutes);
app.use('/', catalogRoutes);
app.use('/', adminRoutes);
app.use('/', adminCategoryRoutes);
app.use('/', learnRoutes);
app.use('/', assignmentRoutes);
app.use('/', quizRoutes);
app.use('/', profileRoutes);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () =>
  console.log(`LMS running at http://localhost:${port} (${isProduction ? 'production' : 'development'})`)
);

const shutdown = (signal) => {
  console.log(`${signal} received, closing server`);
  server.close(() => {
    db.end().finally(() => process.exit(0));
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
