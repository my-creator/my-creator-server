var express = require('express');
var router = express.Router();

router.use('/users', require('./user/index'));
router.use('/boards', require('./board/index'));
router.use('/creators', require('./creator/index'));
router.use('/votes', require('./vote/index'));

module.exports = router;