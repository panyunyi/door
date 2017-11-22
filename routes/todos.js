'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');

var Door = AV.Object.extend('Door');

router.get('/', function (req, res, next) {
  let start = 24;
  async.timesSeries(59, function (n, callback) {
    let door = new Door();
    door.set('isDel', false);
    door.set('number', start.toString());
    door.set('default', 2);
    door.set('name', start.toString());
    let strip = "10.10.10." + start.toString();
    door.set('ip', strip);
    start++;
    console.log('%j',door);
    callback(null, door);
  }, function (err, doors) {
    console.log(doors.length);
    AV.Object.saveAll(doors).then(function (objects) {
      // 成功
      res.jsonp(doors.length);
    }, function (error) {
      // 异常处理
      console.log(error);
    });
  });
});


module.exports = router;
