'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var History = AV.Object.extend('History');
var Log = AV.Object.extend('Log');
//门禁权限判断
router.get('/', function (req, res) {
    let sess = req.session;
    //sess.objid = "593cc47bac502e006cedfadb";
    if (typeof (sess.objid) == "undefined") {
        let code = req.query.code;
        let state = req.query.state;
        //let nd=(state.substr(0,2)=="nd")?"http://1p729i9813.51mypc.cn:44566":"http://223.112.77.226:5000";
        let nd="http://223.112.77.226:5000";
        if(state.substr(0,2)=="nd"){
            res.redirect("http://doorwap.1percentsoft.cn/open.html?scope=snsapi_userinfo&code="+code+"&state="+state);
        }
        let client = request.createClient('https://api.weixin.qq.com/sns/oauth2/');
        client.get('access_token?appid=' + appid + '&secret=' + secret + '&code=' + code + '&grant_type=authorization_code', function (err, res1, body) {
            if (body != "undefined" && typeof (body.openid) != "undefined") {
                let openid = body.openid;
                let query = new AV.Query('WxUser');
                query.equalTo('openid', openid);
                //query.equalTo('flag', 1);
                query.count().then(function (count) {
                    if (count == 0) {
                        res.render('menu1', { openid: openid });
                    } else if (count == 1) {
                        query.first().then(function (data) {
                            sess.objid = data.id;
                            let doorQuery = new AV.Query('Door');
                            doorQuery.equalTo('number', state);
                            doorQuery.equalTo('isDel', false);
                            doorQuery.first().then(function (door) {
                                if (typeof (door) == "undefined") {
                                    return res.render('fail', { title: "未找到编号为" + state + "的门", ip: "" });
                                }
                                if(door.get('test')==1){
                                    let client = request.createClient('http://39.98.90.27:8705/service-resident/wechat/');
                                    door.increment('count',1);
                                    door.save();
                                    client.post('remoteOpen?doorId=57', data, function (err, ress, body) {
                                        console.log(body);
                                         res.render('open1');
                                    });
                                    return;
                                }
                                let mapQuery = new AV.Query('UserDoorMap');
                                mapQuery.equalTo('door', door);
                                mapQuery.equalTo('user', data);
                                mapQuery.equalTo('isDel', false);
                                mapQuery.lessThanOrEqualTo('start', new Date());
                                mapQuery.greaterThanOrEqualTo('day', new Date());
                                mapQuery.count().then(function (mapcount) {
                                    if (mapcount > 0) {
                                        let history = new History();
                                        history.set('user', data);
                                        history.set('door', door);
                                        history.save();
                                        res.render('open', { title: door.get('name') + "已开", ip: door.get('ip'), state: 1 ,nd:nd});
                                    } else if (data.get('flag') == 1) {
                                        res.render('fail', { title: "没有" + door.get('name') + "权限", ip: "", state: 0 });
                                    } else if (data.get('flag') == 0) {
                                        res.render('progress', { title: "正在审核..." });
                                    } else if (data.get('flag') == -1) {
                                        res.render('menu1', { openid: openid });
                                    }
                                });
                            });
                        });
                    } else {
                        let log = new Log();
                        log.set('openid', openid);
                        log.set('log', 'openid重复');
                        log.save().then(function () {
                            res.send("用户信息有重复，请联系管理员。");
                        });
                    }
                });
            } else {
                res.send("已超时，请退出菜单重进。");
            }
        });
    } else {
        let user = AV.Object.createWithoutData('WxUser', sess.objid);
        let state = req.query.state;
        user.fetch().then(function (data) {
            let doorQuery = new AV.Query('Door');
            doorQuery.equalTo('number', state);
            doorQuery.equalTo('isDel', false);
            doorQuery.first().then(function (door) {
                if (typeof (door) == "undefined") {
                    return res.render('fail', { title: "未找到编号为" + state + "的门", ip: "" });
                }
                let mapQuery = new AV.Query('UserDoorMap');
                mapQuery.equalTo('door', door);
                mapQuery.equalTo('user', data);
                mapQuery.lessThanOrEqualTo('start', new Date());
                mapQuery.greaterThanOrEqualTo('day', new Date());
                mapQuery.equalTo('isDel', false);
                mapQuery.count().then(function (mapcount) {
                    if (mapcount > 0) {
                        let history = new History();
                        history.set('user', data);
                        history.set('door', door);
                        history.save();
                        res.render('open', { title: door.get('name') + "已开", ip: door.get('ip'), state: 1 });
                    } else if (data.get('flag') == 1) {
                        res.render('fail', { title: "没有" + door.get('name') + "权限", ip: "", state: 0 });
                    } else if (data.get('flag') == 0) {
                        res.render('progress', { title: "正在审核。" });
                    } else if (data.get('flag') == -1) {
                        res.render('menu1', { openid: openid });
                    }
                });
            });
        });
    }
});

module.exports = router;
