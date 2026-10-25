const router = require('express').Router();
const { requireLogin, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/adminCategoryController');

router.use('/admin', requireLogin, requireRole('admin'));

router.get('/admin/categories', ctrl.index);
router.get('/admin/categories/new', ctrl.showCreate);
router.post('/admin/categories', ctrl.create);
router.get('/admin/categories/:id/edit', ctrl.showEdit);
router.post('/admin/categories/:id', ctrl.update);
router.post('/admin/categories/:id/delete', ctrl.destroy);

module.exports = router;
