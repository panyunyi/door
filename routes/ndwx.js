'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var WxUser = AV.Object.extend('WxUser');
var async = require('async');

function combine(companies, floorArr) {
    let arr = [];
    async.map(floorArr, function (floor, callback1) {
        let onefloor = { label: floor + "F", value: floor };
        let comArr = [];
        async.map(companies, function (company, callback2) {
            let onecompany = { label: company.name, value: company.id };
            if (company.floor == floor) {
                comArr.push(onecompany);
            }
            callback2(null, 1);
        }, function (err, companies) {
            onefloor['children'] = comArr;
            callback1(null, onefloor);
        });
    }, function (err, floors) {
        arr = floors;
    });
    return arr;
}

router.get('/company', function (req, res) {
    let companyQuery = new AV.Query('Company');
    let floorArr = [];
    companyQuery.equalTo('isDel', false);
    companyQuery.ascending('floor');
    companyQuery.find().then(function (companies) {
        async.map(companies, function (company, callback) {
            let floor = company.get('floor');
            let one = { name: company.get('name'), floor: floor, id: company.id };
            if (floorArr.indexOf(floor) == -1) {
                floorArr.push(floor);
            }
            callback(null, one);
        }, function (err, companies) {
            let json = combine(companies, floorArr);
            res.jsonp({ data: json });
        });
    });
});

router.get('/', function (req, res) {
    let sess = req.session;

    // res.render('wx_register', { openid: "595de7bd128fe1005877ef1f"});

    // return;
    //if (typeof (sess.objid) == "undefined") {
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
                                return res.render('wx_register', { openid: openid });
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
                                    return res.render('progress', { title: "提交成功，等待审核。" });
                                } else {
                                    return res.render('wx_register', { openid: openid });
                                }
                                return res.render('success', { title: title ,id:data.id});
                            });
                        } else {
                            let log = new Log();
                            log.set('openid', openid);
                            log.set('log', 'openid重复');
                            log.save().then(function () {
                                return res.send("用户信息有重复，请联系管理员。");
                            });
                        }
                    });
                } else {
                    return res.send("已超时，请退出菜单重进。");
                }
            });
        } else {
            return res.send("已超时，请退出菜单重进。");
        }
    });
    // } else {
    //     let user = AV.Object.createWithoutData('WxUser', sess.objid);
    //     user.fetch().then(function () {
    //         if (typeof (user.get('openid')) == "undefined" || user.get('flag') < 0) {
    //             req.session = null;
    //             res.render('fail', { title: "退出重试" });
    //         } else {
    //             res.render('success', { title: "您已注册" });
    //         }
    //     });
    // }
});
//常驻用户注册
router.post('/register', function (req, res) {
    let openid = req.body.openid;
    let company = AV.Object.createWithoutData('Company', req.body.company);
    if (typeof (company) == "undefined" || req.body.name == "" || req.body.phone == "") {
        return res.send({ error: 1, msg: "注册信息有误，请正确填写" });
    }
    let query = new AV.Query('WxUser');
    query.equalTo('openid', openid);
    query.first().then(function (data) {
        if (typeof (data) == "undefined") {
            let user = new WxUser();
            user.set('name', req.body.name);
            user.set('flag', 0);
            user.set('phone', req.body.phone);
            user.set('company', company);
            user.set('openid', openid);
            user.save().then(function () {
                res.send({ error: 0, msg: "" });
            });
        } else {
            data.set('company', company);
            data.set('name', req.body.name);
            data.set('flag', 0);
            data.set('phone', req.body.phone);
            data.save().then(function () {
                res.send({ error: 0, msg: "" });
            });
        }
    });
});

router.get('/success', function (req, res) {
    res.render('progress', { title: "提交成功，等待审核。" });
});

router.get('/open1', function (req, res) {
    res.render('open1');
});

router.get('/grid', function (req, res) {
    res.render('grid', { });
});
module.exports = router;
