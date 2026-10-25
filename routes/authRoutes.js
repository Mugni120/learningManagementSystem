const router = require('express').Router();
const { requireGuest } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.get('/', (req, res) => res.redirect(req.session.user ? '/dashboard' : '/login'));
router.get('/login', requireGuest, ctrl.showLogin);
router.post('/login', requireGuest, ctrl.login);
router.get('/register', requireGuest, ctrl.showRegister);
router.post('/register', requireGuest, ctrl.register);
router.post('/logout', ctrl.logout);

module.exports = router;
