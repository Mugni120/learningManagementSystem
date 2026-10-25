const router = require('express').Router();
const ctrl = require('../controllers/catalogController');

router.get('/courses', ctrl.index);
router.get('/courses/:slug', ctrl.show);

module.exports = router;
