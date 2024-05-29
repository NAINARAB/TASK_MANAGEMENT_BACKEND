var express = require('express');
var router = express.Router();
var user = require('./users');
const ERPRouter = require('./erpApis')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/',user, ERPRouter)


module.exports = router;
