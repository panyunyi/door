'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');

router.get('/', function (req, res) {
    let sess = req.session;
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
                                    res.render('wx_register', { openid: openid });
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    sess.objid = data.id;
                                    let title = "";
                                    if (data.get('flag') == 1) {
                                        title = "您已注册";
                                    } else if (data.get('flag') == 0) {
                                        title = "正在审核";
                                    } else {
                                        return res.render('wx_register', { openid: openid });
                                    }
                                    res.render('success', { title: "您已注册" });
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
                res.render('success', { title: "您已注册" });
            }
        });
    }
});

router.post('/register', function (req, res) {
    let openid = req.body.openid;
    let query = new AV.Query('WxUser');
    query.equalTo('openid', openid);
    query.first().then(function (data) {
        let user = new WxUser();
        user.set('name', req.body.name);
        user.set('flag', 0);
        user.set('door', req.body.door);
        user.set('phone', req.body.phone);
        let companyQuery = new AV.Query('Company');
        companyQuery.equalTo('number', req.body.door);
        companyQuery.first().then(function (company) {
            if (typeof (company) != "undefined") {
                user.set('company', req.body.company);
                if (typeof (data) == "undefined") {
                    user.set('openid', openid);
                    user.save();
                    res.send({ error: 0, msg: "" });
                } else {
                    data.set('name', req.body.name);
                    data.set('flag', 0);
                    data.set('door', req.body.door);
                    data.set('phone', req.body.phone);
                    data.save();
                    res.send({ error: 0, msg: "" });
                }
            } else {
                res.send({ error: 1, msg: "未找到门牌号" });
            }
        });
    });
});

router.get('/success', function (req, res) {
    res.render('success', { title: "提交成功，等待审核。" })
});


module.exports = router;
