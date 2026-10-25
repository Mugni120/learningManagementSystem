const router = require('express').Router();
const { requireLogin, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/instructorController');

router.use('/instructor', requireLogin, requireRole('instructor'));

router.get('/instructor/courses', ctrl.index);
router.get('/instructor/courses/new', ctrl.showCreate);
router.post('/instructor/courses', ctrl.create);
router.get('/instructor/courses/:id', ctrl.builder);
router.get('/instructor/courses/:id/edit', ctrl.showEdit);
router.post('/instructor/courses/:id', ctrl.update);
router.post('/instructor/courses/:id/delete', ctrl.destroy);
router.post('/instructor/courses/:id/publish', ctrl.publish);
router.post('/instructor/courses/:id/unpublish', ctrl.unpublish);
router.post('/instructor/courses/:id/modules', ctrl.addModule);
router.post('/instructor/modules/:id', ctrl.renameModule);
router.post('/instructor/modules/:id/delete', ctrl.deleteModule);
router.get('/instructor/lessons/new', ctrl.showLessonForm);
router.post('/instructor/lessons', ctrl.createLesson);
router.get('/instructor/lessons/:id/edit', ctrl.showLessonEdit);
router.post('/instructor/lessons/:id', ctrl.updateLesson);
router.post('/instructor/lessons/:id/delete', ctrl.deleteLesson);
router.get('/instructor/courses/:id/enrollments', ctrl.enrollments);

module.exports = router;
