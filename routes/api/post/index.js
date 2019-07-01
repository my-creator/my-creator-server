var express = require('express');
var router = express.Router();

router.use('/', require('./post'));

module.exports = router;
