var express = require('express');
var router = express.Router();

router.use('/users', require('./user/index'));
router.use('/boards', require('./board/index'));
router.use('/creators', require('./creator/index'));
router.use('/votes', require('./vote/index'));
router.use('/hashtags', require('./hashtags/index'));
router.use('/categories', require('./categories/index'));

module.exports = router;