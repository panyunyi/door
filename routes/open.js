'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');

router.get('/', function (req, res) {
    let sess = req.session;
    sess.objid = "591323571b69e600686e6089";
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
                                wxuser.save().then(function (data) {
                                    sess.objidid = data.id;
                                    res.render('index', { objid: data.id });
                                }, function (err) {
                                    console.log(err);
                                });
                            } else if (count == 1) {
                                query.first().then(function (data) {
                                    sess.objid = data.id;
                                    res.render('index', { objid: data.id });
                                });
                            } else {
                                res.send("用户信息有重复，请联系管理员。");
                            }
                        });
                    } else {
                        res.send("已超时，请退出菜单重进。2");
                    }
                });
            } else {
                res.send("已超时，请退出菜单重进。1");
            }
        });
    } else {
        res.render('index', { objid: sess.objid })
    }
});

let flag = false;
router.ws('/echo', function (ws, req) {
    ws.on('message', function (msg) {
        console.log( msg);
        let door = AV.Object.createWithoutData('Door', "5925a5c7a22b9d0058b13a01");
        let user = AV.Object.createWithoutData('WxUser', "591323571b69e600686e6089");
        let query = new AV.Query('UserDoorMap');
        query.equalTo('door', door);
        query.equalTo('user', user);
        query.count().then(function (count) {
            if (count == 1) {
                
                flag = true;
            } else {
                flag = false;
            }
        });
    });
});

router.ws('/door', function (ws, req) {
    let interval = setInterval(function () {
        if (flag) {
            flag=false;
            ws.send(1);
        }
    }, 1000);
    ws.on('message', function (msg) {
        console.log(msg);

    });
});

module.exports = router;
