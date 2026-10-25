const router = require('express').Router();
const { requireLogin } = require('../middleware/auth');
const ctrl = require('../controllers/profileController');

router.use(requireLogin);

router.get('/profile', ctrl.edit);
router.get('/profile/password', (req, res) => res.render('profile/password', { title: 'Ubah Password', errors: [], msg: null }));
router.post('/profile', ctrl.update);
router.post('/profile/password', ctrl.changePassword);

module.exports = router;
