'use strict';
var router = require('express').Router();
var AV = require('leanengine');

router.get('/', function (req, res, next) {
  //res.render('menu1');
  res.render('grid');
})

router.get('/1', function (req, res, next) {
  res.render('menu1');
})

router.get('/2', function (req, res, next) {
  res.render('menu2');
})

module.exports = router;
