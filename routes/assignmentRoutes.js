const router = require('express').Router();
const { requireLogin, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/assignmentController');

router.get('/assignments/:id', requireLogin, requireRole('student'), ctrl.showStudent);
router.post('/assignments/:id/submit', requireLogin, requireRole('student'), ctrl.submit);

router.use('/instructor', requireLogin, requireRole('instructor'));
router.get('/instructor/assignments', ctrl.index);
router.get('/instructor/assignments/new', ctrl.showCreate);
router.post('/instructor/assignments', ctrl.create);
router.get('/instructor/assignments/:id/edit', ctrl.showEdit);
router.post('/instructor/assignments/:id', ctrl.update);
router.post('/instructor/assignments/:id/delete', ctrl.destroy);
router.get('/instructor/assignments/:id/submissions', ctrl.submissions);
router.post('/instructor/submissions/:id/grade', ctrl.grade);

module.exports = router;
