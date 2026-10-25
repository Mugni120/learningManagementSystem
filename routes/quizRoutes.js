const router = require('express').Router();
const { requireLogin, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/quizController');

router.get('/quizzes/:id/take', requireLogin, requireRole('student'), ctrl.take);
router.post('/quizzes/:id/submit', requireLogin, requireRole('student'), ctrl.submitAttempt);
router.get('/quizzes/:id/result', requireLogin, requireRole('student'), ctrl.result);

router.use('/instructor', requireLogin, requireRole('instructor'));
router.get('/instructor/quizzes', ctrl.index);
router.get('/instructor/quizzes/new', ctrl.showCreate);
router.post('/instructor/quizzes', ctrl.create);
router.get('/instructor/quizzes/:id', ctrl.show);
router.get('/instructor/quizzes/:id/edit', ctrl.showEdit);
router.post('/instructor/quizzes/:id', ctrl.update);
router.post('/instructor/quizzes/:id/delete', ctrl.destroy);
router.post('/instructor/quizzes/:id/questions', ctrl.addQuestion);
router.post('/instructor/questions/:id/delete', ctrl.deleteQuestion);
router.get('/instructor/quizzes/:id/attempts', ctrl.attempts);

module.exports = router;
