const router = require('express').Router();
const { requireLogin, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use('/admin', requireLogin, requireRole('admin'));

router.get('/admin/users', ctrl.users);
router.post('/admin/users/:id', ctrl.updateUser);
router.post('/admin/users/:id/delete', ctrl.destroyUser);
router.get('/admin/courses', ctrl.courses);

module.exports = router;
