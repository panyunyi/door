'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');

router.get('/', function (req, res) {
    var emp = AV.Object.createWithoutData('Employee', '5934168ba22b9d0058e77fdc');
    emp.fetch().then(function(){
        res.jsonp(emp.get('user'));
    });
});


module.exports = router;
