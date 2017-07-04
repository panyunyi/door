'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');

router.get('/', function (req, res) {
    let sess = req.session;
    //sess.objid = "591323571b69e600686e6089";
    if (typeof (sess.objid) == "undefined") {
        let code = req.query.code;
        let state = req.query.state;
        let client = request.createClient('https://api.weixin.qq.com/sns/oauth2/');
        client.get('access_token?appid=' + appid + '&secret=' + secret + '&code=' + code + '&grant_type=authorization_code', function (err, res1, body) {
            if (body != "undefined" && typeof (body.openid) != "undefined") {
                client = request.createClient('https://api.weixin.qq.com/sns/');
                client.get('userinfo?access_token=' + body.access_token + '&openid=' + body.openid + '&lang=zh_CN', function (err2, res2, body2) {
                    if (body2 != "undefined" && typeof (body2.openid) != "undefined") {
                        let openid = body2.openid;
                        let query = new AV.Query('WxUser');
                        query.equalTo('openid', openid);
                        query.count().then(function (count) {
                            if (count == 0) {
                                let wxuser = new WxUser();
                                wxuser.set('openid', openid);
                                wxuser.set('nickname', body2.nickname);
                                wxuser.set('sex', body2.sex == 1 ? "男" : "女");
                                wxuser.set('city', body2.city);
                                wxuser.set('province', body2.province);
                                wxuser.set('country', body2.country);
                                wxuser.set('headimgurl', body2.headimgurl);
                                wxuser.set('flag', -1);
                                wxuser.save().then(function (data) {
                                    sess.objidid = data.id;
                                    res.render('visit', { openid: openid });
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    sess.objid = data.id;
                                    res.render('visit', { openid: openid });
                                });
                            } else {
                                res.send("用户信息有重复，请联系管理员。");
                            }
                        });
                    } else {
                        res.send("已超时，请退出菜单重进。");
                    }
                });
            } else {
                res.send("已超时，请退出菜单重进。");
            }
        });
    } else {
        let user = AV.Object.createWithoutData('WxUser', sess.objid);
        user.fetch().then(function () {
            if (typeof (user.get('openid')) == "undefined" || user.get('flag') < 0) {
                req.session = null;
                res.render('fail', { title: "退出重试" });
            } else {
                res.render('visit', { openid: user.get('openid') });
            }
        });
    }
});

var Visit = AV.Object.extend('Visit');
router.post('/apply', function (req, res) {
    let openid = req.body.openid;
    let phone = req.body.phone;
    let name = req.body.name;
    let content = req.body.content;
    let door = req.body.door;
    let phone2 = req.body.phone2;
    let day = req.body.day.split('-');
    let time = req.body.time.split(':');
    let query = new AV.Query('WxUser');
    query.equalTo('openid', openid);
    query.first().then(function (user) {
        if (typeof (user) != "undefined") {
            user.set('name', name);
            user.set('phone', phone);
            user.save();
            let interviewQuery = new AV.Query('WxUser');
            interviewQuery.equalTo('phone', phone2);
            interviewQuery.first().then(function (interview) {
                if (typeof (interview) != "undefined") {
                    let companyQuery = new AV.Query('Company');
                    companyQuery.equalTo('number', door);
                    companyQuery.first().then(function (company) {
                        if (typeof (company) != "undefined") {
                            let visit = new Visit();
                            visit.set('content', content);
                            visit.set('interviewee', interview);
                            visit.set('pass', 0);
                            visit.set('user', user);
                            visit.set('company', company);
                            visit.set('day', new Date(day[0] * 1, day[1] * 1 - 1, day[2] * 1, time[0] * 1, time[1] * 1, 0));
                            visit.save().then(function (visit) {
                                let data = {
                                    touser: interview.get('openid'), template_id: "0MfPUimCvcbKya-LWH3UfW2vqdPMZgPJKW3XpzUV2DQ", url: 'http://clouddoor.leanapp.cn/audit/' + visit.id, "data": {
                                        "first": {
                                            "value": "您有新的访客申请，请审核。",
                                            "color": "#173177"
                                        },
                                        "keyword1": {
                                            "value": name,
                                            "color": "#173177"
                                        },
                                        "keyword2": {
                                            "value": content,
                                            "color": "#173177"
                                        },
                                        "keyword3": {
                                            "value": phone,
                                            "color": "#173177"
                                        },
                                        "keyword4": {
                                            "value": req.body.day,
                                            "color": "#173177"
                                        },
                                        "remark": {
                                            "value": "点击进入审核。",
                                            "color": "#173177"
                                        }
                                    }
                                };
                                getTokenAndSendMsg(data);
                                res.send({ error: 0, msg: "" });
                            });
                        } else {
                            res.send({ error: 1, msg: "公司门牌号正确。" });
                        }
                    });
                } else {
                    res.send({ error: 1, msg: "被访者的手机号不正确。" });
                }
            });
        } else {
            res.send({ error: 1, msg: "无法获取微信信息，退出重试。" });
        }
    });
});

router.get('/success', function (req, res) {
    res.render('success', { title: "提交成功，等待审核。" })
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
