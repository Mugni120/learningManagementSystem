const router = require('express').Router();
const { requireLogin } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

router.get('/dashboard', requireLogin, ctrl.home);

module.exports = router;
