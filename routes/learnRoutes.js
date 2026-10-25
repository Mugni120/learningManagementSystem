const router = require('express').Router();
const { requireLogin, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/learnController');

router.use('/courses', requireLogin, requireRole('student'));
router.use('/learn', requireLogin, requireRole('student'));

router.post('/courses/:slug/enroll', ctrl.enroll);
router.get('/learn/:courseId', ctrl.coursePlayer);
router.get('/learn/:courseId/lessons/:lessonId', ctrl.lessonView);
router.post('/learn/:courseId/lessons/:lessonId/complete', ctrl.markComplete);
router.get('/learn/:courseId/certificate', ctrl.certificate);

module.exports = router;
