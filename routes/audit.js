'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var moment = require('moment');
moment.locale('zh-cn');
var async = require('async');
//
router.get('/:id', function (req, res) {
    let id = req.params.id;
    let query = new AV.Query('Visit');
    query.equalTo('objectId', id);
    query.include('user');
    query.include('interviewee');
    query.first().then(function (data) {
        if (typeof (data) != "undefined") {
            let time = new moment(data.get('day'));
            data.set('openid', data.get('user').get('openid'));
            data.set('interviewee', data.get('interviewee').get('name'));
            data.set('phone', data.get('user').get('phone'));
            data.set('user', data.get('user').get('name'));
            data.set('day', time.format('LLLL'));
            res.render('audit', { data: data });
        } else {
            res.render('fail', { title: "无记录" })
        }
    });
});
//访客审核
var UserDoorMap = AV.Object.extend('UserDoorMap');
router.get('/submit/:number/:id/:openid/:hour', function (req, res) {
    let id = req.params.id;
    let openid = req.params.openid;
    let number = req.params.number * 1;
    let hour = req.params.hour * 1;
    let name = req.query.name;
    let phone = req.query.phone;
    let visit = AV.Object.createWithoutData('Visit', id);
    visit.set('pass', number);
    visit.save();
    visit.fetch({
        include: ['interviewee']
    }).then(function () {
        let audittime = new moment(visit.get('updatedAt'));
        if (number == 1) {
            if (visit.get('interviewee').get('company').id == '59b6102eac502e006af87c2e') {
                let query = new AV.Query('Door');
                query.equalTo('isDel', false);
                query.equalTo('visit', 1);
                query.find().then(function (results) {
                    async.map(results, function (result, callback) {
                        let userdoormap = new UserDoorMap();
                        userdoormap.set('isDel', false);
                        userdoormap.set('door', result);
                        userdoormap.set('user', visit.get('user'));
                        let time = new moment(visit.get('day'));
                        userdoormap.set('start', visit.get('day'));
                        userdoormap.set('day', new Date(time.add(hour, 'h').utc().valueOf()));
                        userdoormap.set('temporary', true);
                        callback(null, userdoormap);
                    }, function (err, results) {
                        AV.Object.saveAll(results).then(function () {
                            let data = {
                                touser: openid, template_id: "HyIvEtj7tO5bCsuFNH5FyJgFYQy3UkHYdFm0MVpkABM", url: '', "data": {
                                    "first": {
                                        "value": "您的预约结果如下。",
                                        "color": "#173177"
                                    },
                                    "keyword1": {
                                        "value": name,
                                        "color": "#173177"
                                    },
                                    "keyword2": {
                                        "value": phone,
                                        "color": "#173177"
                                    },
                                    "keyword3": {
                                        "value": audittime.format('LLLL'),
                                        "color": "#173177"
                                    },
                                    "keyword4": {
                                        "value": "允许访问",
                                        "color": "#173177"
                                    },
                                    "remark": {
                                        "value": "",
                                        "color": "#173177"
                                    }
                                }
                            };
                            getTokenAndSendMsg(data);
                            res.send('0');
                        });
                    });
                });
            } else {
                let query = new AV.Query('UserDoorMap');
                query.equalTo('isDel', false);
                query.equalTo('user', visit.get('interviewee'));
                query.find().then(function (results) {
                    async.map(results, function (result, callback) {
                        let userdoormap = new UserDoorMap();
                        userdoormap.set('isDel', false);
                        userdoormap.set('door', result.get('door'));
                        userdoormap.set('user', visit.get('user'));
                        let time = new moment(visit.get('day'));
                        userdoormap.set('start', visit.get('day'));
                        userdoormap.set('day', new Date(time.add(hour, 'h').utc().valueOf()));
                        userdoormap.set('temporary', true);
                        callback(null, userdoormap);
                    }, function (err, results) {
                        AV.Object.saveAll(results).then(function () {
                            let data = {
                                touser: openid, template_id: "HyIvEtj7tO5bCsuFNH5FyJgFYQy3UkHYdFm0MVpkABM", url: '', "data": {
                                    "first": {
                                        "value": "您的预约结果如下。",
                                        "color": "#173177"
                                    },
                                    "keyword1": {
                                        "value": name,
                                        "color": "#173177"
                                    },
                                    "keyword2": {
                                        "value": phone,
                                        "color": "#173177"
                                    },
                                    "keyword3": {
                                        "value": audittime.format('LLLL'),
                                        "color": "#173177"
                                    },
                                    "keyword4": {
                                        "value": "允许访问",
                                        "color": "#173177"
                                    },
                                    "remark": {
                                        "value": "",
                                        "color": "#173177"
                                    }
                                }
                            };
                            getTokenAndSendMsg(data);
                            res.send('0');
                        });
                    });
                });
            }
        } else {
            let data = {
                touser: openid, template_id: "HyIvEtj7tO5bCsuFNH5FyJgFYQy3UkHYdFm0MVpkABM", url: '', "data": {
                    "first": {
                        "value": "您的预约结果如下。",
                        "color": "#173177"
                    },
                    "keyword1": {
                        "value": name,
                        "color": "#173177"
                    },
                    "keyword2": {
                        "value": phone,
                        "color": "#173177"
                    },
                    "keyword3": {
                        "value": audittime.format('LLLL'),
                        "color": "#173177"
                    },
                    "keyword4": {
                        "value": "拒绝访问",
                        "color": "#173177"
                    },
                    "remark": {
                        "value": "",
                        "color": "#173177"
                    }
                }
            };
            getTokenAndSendMsg(data);
            res.send('0');
        }
    });
});

function getTokenAndSendMsg(data) {
    let client = request.createClient('https://api.weixin.qq.com/cgi-bin/');
    client.get('token?grant_type=client_credential&appid=' + appid + '&secret=' + secret, function (err, res, body) {
        let token = body.access_token;
        client = request.createClient('https://api.weixin.qq.com/cgi-bin/message/template/');
        client.post('send?access_token=' + token, data, function (err, res, body) {
            console.log(body);
        });
    });
}
module.exports = router;
