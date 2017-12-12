'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');

var Door = AV.Object.extend('Door');

// router.get('/', function (req, res, next) {
//   let start = 24;
//   async.timesSeries(59, function (n, callback) {
//     let door = new Door();
//     door.set('isDel', false);
//     door.set('number', start.toString());
//     door.set('default', 2);
//     door.set('name', start.toString());
//     let strip = "10.10.10." + start.toString();
//     door.set('ip', strip);
//     start++;
//     console.log('%j',door);
//     callback(null, door);
//   }, function (err, doors) {
//     console.log(doors.length);
//     AV.Object.saveAll(doors).then(function (objects) {
//       // 成功
//       res.jsonp(doors.length);
//     }, function (error) {
//       // 异常处理
//       console.log(error);
//     });
//   });
// });

// var UserDoorMap = AV.Object.extend('UserDoorMap');
// router.get('/', function (req, res, next) {
//   let start = 1;
//   let user = AV.Object.createWithoutData('WxUser', '595deef5ac502e006bab9963');
//   async.timesSeries(83, function (n, callback) {
//     let query=new AV.Query('Door');
//     query.equalTo('isDel',false);
//     query.equalTo('number',start.toString());
//     start++;
//     query.first().then(function(door){
//       console.log('%j',door);
//       let udm=new UserDoorMap();
//       udm.set('isDel',false);
//       udm.set('start', new Date(2015, 1, 1));
//       udm.set('day', new Date(2099, 11, 30));
//       udm.set('door',door);
//       udm.set('user',user);
//       udm.save().then(function(){
//         callback(null, door);
//       });
//     });
//   }, function (err, doors) {
//     console.log(doors.length);
//     res.jsonp(doors.length);
//   });
// });

module.exports = router;
