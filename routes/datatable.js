'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var request = require('request-json');
var appid = process.env.wx_appid;
var secret = process.env.wx_secret;
var moment = require('moment');
moment.locale('zh-cn');
//模板消息发送
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
//公司信息表
router.get('/company', function (req, res) {
    let query = new AV.Query('Company');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        async.map(results, function (result, callback) {
            result.set('DT_RowId', result.id);
            callback(null, result);
        }, function (err, data) {
            res.jsonp({ "data": data });
        });
    });
});
//公司对应的门禁权限（暂时弃用）
router.get('/companydoormap/:id', function (req, res) {
    let resdata = {};
    let companyarr = [];
    function promise1(callback) {
        let id = req.params.id;
        let company = AV.Object.createWithoutData('Company', id);
        company.fetch().then(function () {
            companyarr.push({ 'label': company.get('name'), 'value': company.id });
            let query = new AV.Query('CompanyDoorMap');
            query.equalTo('isDel', false);
            query.equalTo('company', company);
            query.include('door');
            query.find().then(function (results) {
                async.map(results, function (result, callback1) {
                    result.set('DT_RowId', result.id);
                    result.set('name', result.get('door').get('name'));
                    result.set('number', result.get('door').get('number'));
                    result.set('ip', result.get('door').get('ip'));
                    result.set('doorid', result.get('door').id);
                    callback1(null, result);
                }, function (err, results) {
                    resdata["data"] = results;
                    callback(null, 1);
                });
            });
        });
    }
    function promise2(callback) {
        let query = new AV.Query('Door');
        query.equalTo('isDel', false);
        query.ascending('number');
        query.limit(1000);
        query.find().then(function (results) {
            async.map(results, function (result, callback1) {
                result.set('label', result.get('name'));
                result.set('value', result.id);
                callback1(null, result);
            }, function (err, data) {
                callback(null, data);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        function (callback) {
            promise2(callback);
        }], function (err, results) {
            resdata["options"] = Object.assign({ "doorid": results[1], "company": companyarr });
            res.jsonp(resdata);
        });
});
//新增公司
var Company = AV.Object.extend('Company');
router.post('/company/add', function (req, res) {
    let arr = req.body;
    let company = new Company();
    company.set('name', arr['data[0][name]']);
    company.set('floor', arr['data[0][floor]'] * 1);
    company.set('number', arr['data[0][number]']);
    company.set('connecter', arr['data[0][connecter]']);
    company.set('phone', arr['data[0][phone]']);
    company.set('isDel', false);
    company.save().then(function (result) {
        let data = [];
        result.set('DT_RowId', result.id);
        data.push(result);
        res.jsonp({ "data": data });
    }, function (error) {
        console.log(error);
    });
});
//编辑公司
router.put('/company/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let company = AV.Object.createWithoutData('Company', id);
    company.set('name', arr['data[' + id + '][name]']);
    company.set('floor', arr['data[' + id + '][floor]'] * 1);
    company.set('number', arr['data[' + id + '][number]']);
    company.set('connecter', arr['data[' + id + '][connecter]']);
    company.set('phone', arr['data[' + id + '][phone]']);
    company.set('isDel', false);
    company.save().then(function (result) {
        let data = [];
        result.set('DT_RowId', result.id);
        data.push(result);
        res.jsonp({ "data": data });
    }, function (error) {
        console.log(error);
    });
});
//删除公司
router.delete('/company/remove/:id', function (req, res) {
    let id = req.params.id;
    let company = AV.Object.createWithoutData('Company', id);
    company.set('isDel', true);
    company.save().then(function () {
        res.jsonp({ "data": [] });
    });
});
//新增公司对应的门禁权限（暂时弃用）
var CompanyDoorMap = AV.Object.extend('CompanyDoorMap');
router.post('/companydoormap/add', function (req, res) {
    let arr = req.body;
    let companydoormap = new CompanyDoorMap();
    let company = AV.Object.createWithoutData('Company', arr['data[0][company]']);
    let door = AV.Object.createWithoutData('Door', arr['data[0][doorid]']);
    let query = new AV.Query('CompanyDoorMap');
    query.equalTo('company', company);
    query.equalTo('door', door);
    query.equalTo('isDel', false);
    query.count().then(function (count) {
        if (count > 0) {
            res.jsonp({ "data": [], "fieldErrors": [{ "name": "doorid", "status": "已存在" }] });
        } else {
            companydoormap.set('company', company);
            companydoormap.set('door', door);
            companydoormap.set('isDel', false);
            companydoormap.save().then(function (result) {
                let data = [];
                result.set('DT_RowId', result.id);
                door.fetch().then(function () {
                    result.set('name', result.get('door').get('name'));
                    result.set('number', result.get('door').get('number'));
                    result.set('ip', result.get('door').get('ip'));
                    data.push(result);
                    res.jsonp({ "data": data });
                });
            }, function (error) {
                console.log(error);
            });
        }
    });
});
//修改公司对应的门禁权限（暂时弃用）
router.put('/companydoormap/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let companydoormap = AV.Object.createWithoutData('CompanyDoorMap', id);
    let door = AV.Object.createWithoutData('Door', arr['data[' + id + '][doorid]']);
    companydoormap.set('door', door);
    companydoormap.save().then(function (result) {
        let data = [];
        result.set('DT_RowId', result.id);
        door.fetch().then(function () {
            result.set('name', result.get('door').get('name'));
            result.set('number', result.get('door').get('number'));
            result.set('ip', result.get('door').get('ip'));
            data.push(result);
            res.jsonp({ "data": data });
        });
    }, function (error) {
        console.log(error);
    });
});
//删除公司对应的门禁权限（暂时弃用）
router.delete('/companydoormap/remove/:id', function (req, res) {
    let id = req.params.id;
    let userdoormap = AV.Object.createWithoutData('CompanyDoorMap', id);
    userdoormap.set('isDel', true);
    userdoormap.save().then(function () {
        res.jsonp({ "data": [] });
    });
});
//门禁信息表
router.get('/door', function (req, res) {
    let query = new AV.Query('Door');
    query.equalTo('isDel', false);
    query.limit(1000);
    query.find().then(function (results) {
        async.map(results, function (result, callback) {
            result.set('DT_RowId', result.id);
            callback(null, result);
        }, function (err, data) {
            res.jsonp({ "data": data });
        });
    });
});
//增加门禁
var Door = AV.Object.extend('Door');
router.post('/door/add', function (req, res) {
    let arr = req.body;
    let door = new Door();
    door.set('name', arr['data[0][name]']);
    door.set('number', arr['data[0][number]']);
    door.set('ip', arr['data[0][ip]']);
    door.set('isDel', false);
    door.save().then(function (result) {
        let data = [];
        result.set('DT_RowId', result.id);
        data.push(result);
        res.jsonp({ "data": data });
    }, function (error) {
        console.log(error);
    });
});
//修改门禁
router.put('/door/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let door = AV.Object.createWithoutData('Door', id);
    door.set('name', arr['data[' + id + '][name]']);
    door.set('number', arr['data[' + id + '][number]']);
    door.set('ip', arr['data[' + id + '][ip]']);
    door.set('isDel', false);
    door.save().then(function (result) {
        let data = [];
        result.set('DT_RowId', result.id);
        data.push(result);
        res.jsonp({ "data": data });
    }, function (error) {
        console.log(error);
    });
});
//删除门禁
router.delete('/door/remove/:id', function (req, res) {
    let id = req.params.id;
    let door = AV.Object.createWithoutData('Door', id);
    door.set('isDel', true);
    door.save().then(function () {
        res.jsonp({ "data": [] });
    });
});
//门禁权限表
router.get('/userdoormap/:id', function (req, res) {
    let resdata = {};
    let userarr = [];
    function promise1(callback) {
        let id = req.params.id;
        let user = AV.Object.createWithoutData('WxUser', id);
        user.fetch().then(function () {
            userarr.push({ 'label': user.get('name'), 'value': user.id });
            let query = new AV.Query('UserDoorMap');
            query.equalTo('isDel', false);
            query.equalTo('user', user);
            query.include('door');
            query.find().then(function (results) {
                async.map(results, function (result, callback1) {
                    result.set('DT_RowId', result.id);
                    result.set('name', result.get('door').get('name'));
                    result.set('number', result.get('door').get('number'));
                    result.set('ip', result.get('door').get('ip'));
                    result.set('doorid', result.get('door').id);
                    callback1(null, result);
                }, function (err, results) {
                    resdata["data"] = results;
                    callback(null, 1);
                });
            });
        });
    }
    function promise2(callback) {
        let query = new AV.Query('Door');
        query.equalTo('isDel', false);
        query.ascending('number');
        query.limit(1000);
        query.find().then(function (results) {
            async.map(results, function (result, callback1) {
                result.set('label', result.get('name'));
                result.set('value', result.id);
                callback1(null, result);
            }, function (err, data) {
                callback(null, data);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        function (callback) {
            promise2(callback);
        }], function (err, results) {
            resdata["options"] = Object.assign({ "doorid": results[1], "user": userarr });
            res.jsonp(resdata);
        });
});
//增加某个门禁权限
var UserDoorMap = AV.Object.extend('UserDoorMap');
router.post('/userdoormap/add', function (req, res) {
    let arr = req.body;
    let userdoormap = new UserDoorMap();
    let user = AV.Object.createWithoutData('WxUser', arr['data[0][user]']);
    let door = AV.Object.createWithoutData('Door', arr['data[0][doorid]']);
    let query = new AV.Query('UserDoorMap');
    query.equalTo('user', user);
    query.equalTo('door', door);
    query.equalTo('isDel', false);
    query.count().then(function (count) {
        if (count > 0) {
            res.jsonp({ "data": [], "fieldErrors": [{ "name": "doorid", "status": "已存在" }] });
        } else {
            userdoormap.set('user', user);
            userdoormap.set('door', door);
            userdoormap.set('start', new Date(2015, 1, 1));
            userdoormap.set('day', new Date(2099, 11, 30));
            userdoormap.set('isDel', false);
            userdoormap.save().then(function (result) {
                let data = [];
                result.set('DT_RowId', result.id);
                door.fetch().then(function () {
                    result.set('name', result.get('door').get('name'));
                    result.set('number', result.get('door').get('number'));
                    result.set('ip', result.get('door').get('ip'));
                    data.push(result);
                    res.jsonp({ "data": data });
                });
            }, function (error) {
                console.log(error);
            });
        }
    });
});
//修改某个门禁权限
router.put('/userdoormap/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let userdoormap = AV.Object.createWithoutData('UserDoorMap', id);
    let door = AV.Object.createWithoutData('Door', arr['data[' + id + '][doorid]']);
    userdoormap.set('door', door);
    userdoormap.save().then(function (result) {
        let data = [];
        result.set('DT_RowId', result.id);
        door.fetch().then(function () {
            result.set('name', result.get('door').get('name'));
            result.set('number', result.get('door').get('number'));
            result.set('ip', result.get('door').get('ip'));
            data.push(result);
            res.jsonp({ "data": data });
        });
    }, function (error) {
        console.log(error);
    });
});
//删除某个门禁权限
router.delete('/userdoormap/remove/:id', function (req, res) {
    let id = req.params.id;
    let userdoormap = AV.Object.createWithoutData('UserDoorMap', id);
    userdoormap.set('isDel', true);
    userdoormap.save().then(function () {
        res.jsonp({ "data": [] });
    });
});
//用户信息
router.get('/employee', function (req, res) {
    let resdata = {};
    function promise1(callback) {
        let query = new AV.Query('Employee');
        query.equalTo('isDel', false);
        query.limit(1000);
        query.include('company');
        query.include('user');
        query.find().then(function (results) {
            async.map(results, function (result, callback1) {
                result.set('DT_RowId', result.id);
                result.set('name', result.get('user').get('name'));
                result.set('phone', result.get('user').get('phone'));
                result.set('userId', result.get('user').id);
                //result.set('nickname', result.get('user').get('nickname'));
                result.set('floor', result.get('company').get('floor'));
                result.set('number', result.get('company').get('number'));
                result.set('companyName', result.get('company').get('name'));
                result.set('company', result.get('company').id);
                callback1(null, result);
            }, function (err, data) {
                resdata["data"] = data;
                callback(null, data);
            });
        });
    }
    // function promise2(callback) {
    //     let query = new AV.Query('Door');
    //     query.equalTo('isDel', false);
    //     query.find().then(function (results) {
    //         async.map(results, function (result, callback1) {
    //             result.set('label', result.get('name'));
    //             result.set('value', result.id);
    //             callback1(null, result);
    //         }, function (err, data) {
    //             callback(null, data);
    //         });
    //     });
    // }
    function promise3(callback) {
        let query = new AV.Query('Company');
        query.limit(1000);
        query.equalTo('isDel', false);
        query.find().then(function (results) {
            async.map(results, function (result, callback1) {
                result.set('label', result.get('name'));
                result.set('value', result.id);
                callback1(null, result);
            }, function (err, data) {
                callback(null, data);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        // function (callback) {
        //     promise2(callback);
        // },
        function (callback) {
            promise3(callback);
        }], function (err, results) {
            resdata["options"] = Object.assign({ "company": results[1] });
            res.jsonp(resdata);
        });
});
//修改用户信息
router.put('/employee/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    //let doorarr = arr['data[' + id + '][door][]'];
    let emp = AV.Object.createWithoutData('Employee', id);
    let company = AV.Object.createWithoutData('Company', arr['data[' + id + '][company]']);
    emp.set('company', company);
    emp.save().then(function (emp) {
        emp.fetch().then(function () {
            let user = AV.Object.createWithoutData('WxUser', emp.get('user').id);
            user.set('name', arr['data[' + id + '][name]']);
            user.set('phone', arr['data[' + id + '][phone]']);
            user.save().then(function (u) {
                emp.set('name', u.get('name'));
                emp.set('phone', u.get('phone'));
                let data = [];
                emp.set('DT_RowId', emp.id);
                company.fetch().then(function (c) {
                    emp.set('floor', c.get('floor'));
                    emp.set('number', c.get('number'));
                    emp.set('companyName', c.get('name'));
                    emp.set('company', c.id);
                    data.push(emp);
                    res.jsonp({ "data": data });
                });
            }, function (error) {
                console.log(error);
            });
        });
    });
});
//删除用户及相应权限
router.delete('/employee/remove/:id', function (req, res) {
    let id = req.params.id;
    let emp = AV.Object.createWithoutData('Employee', id);
    emp.set('isDel', true);
    emp.save().then(function () {
        emp.fetch().then(function () {
            let user = emp.get('user')
            user.set('flag', -1);
            user.save();
            let query = new AV.Query('UserDoorMap');
            query.equalTo('user', emp.get('user'));
            query.find().then(function (results) {
                async.map(results, function (result, callback) {
                    result.set('isDel', true);
                    callback(null, result);
                }, function (err, results) {
                    AV.Object.saveAll(results);
                    res.jsonp({ "data": [] });
                });
            });
        });
    });
});
//常驻用户申请
router.get('/employee/apply', function (req, res) {
    let resdata = {};
    var username = req.currentUser.get('username')
    function promise1(callback) {
        let query = new AV.Query('WxUser');
        query.equalTo('flag', 0);
        query.limit(1000);
        query.include('company');
        let company = AV.Object.createWithoutData('Company', '59b6102eac502e006af87c2e');
        if (username == "wy") {
            query.equalTo('company', company);
        } else if (username == "huijin") {
            let company = AV.Object.createWithoutData('Company', '59b6102eac502e006af87c2e');
            query.notEqualTo('company', company);
        }
        query.find().then(function (results) {
            async.map(results, function (result, callback1) {
                result.set('DT_RowId', result.id);
                result.set('floor', result.get('company') ? result.get('company').get('floor') : "");
                result.set('companyId', result.get('company') ? result.get('company').id : "");
                result.set('company', result.get('company') ? result.get('company').get('name') : "");
                let time = new moment(result.get('updatedAt'));
                result.set('time', time.format('YYYY-MM-DD HH:mm:ss'));
                callback1(null, result);
            }, function (err, emps) {
                resdata["data"] = emps;
                callback(null, 1);
            });
        }, function (err) {
            console.log(err);
        });
    }
    function promise2(callback) {
        let query = new AV.Query('Door');
        query.equalTo('isDel', false);
        query.descending('number');
        query.limit(1000);
        //判断用户权限给予相应的可分配门禁
        if (req.currentUser.get('default') == 2) {
            query.greaterThanOrEqualTo('default', 1);
        } else if (req.currentUser.get('default') == 1) {
            query.lessThanOrEqualTo('default', 1);
        }
        query.find().then(function (results) {
            async.map(results, function (result, callback1) {
                result.set('label', result.get('name'));
                result.set('value', result.id);
                callback1(null, result);
            }, function (err, data) {
                callback(null, data);
            });
        });
    }
    function promise3(callback) {
        let query = new AV.Query('Company');
        query.equalTo('isDel', false);
        query.limit(1000);
        query.find().then(function (results) {
            async.map(results, function (result, callback1) {
                result.set('label', result.get('name'));
                result.set('value', result.id);
                callback1(null, result);
            }, function (err, data) {
                callback(null, data);
            });
        });
    }
    async.parallel([
        function (callback) {
            promise1(callback);
        },
        function (callback) {
            promise2(callback);
        },
        function (callback) {
            promise3(callback);
        }
    ], function (err, results) {
        resdata["options"] = Object.assign({ "door": results[1], "companyId": results[2] });
        res.jsonp(resdata);
    });
});

var Employee = AV.Object.extend('Employee');
// router.put('/employee/apply/edit/:id', function (req, res) {
//     let arr = req.body;
//     let id = req.params.id;
//     let user = AV.Object.createWithoutData('WxUser', id);
//     let company = AV.Object.createWithoutData('Company', arr['data[' + id + '][companyId]']);
//     let emp = new Employee();
//     emp.set('company', company);
//     emp.set('user', user);
//     emp.set('isDel', false);
//     user.set('flag', 1);
//     user.save();
//     emp.save();
//     let cdmQuery=new AV.Query('CompanyDoorMap');
//     cdmQuery.equalTo('isDel',false);
//     cdmQuery.equalTo('company',company);
//     cdmQuery.find().then(function(results){
//         async.map(results,function(result,callback){
//             let userdoormap = new UserDoorMap();
//             userdoormap.set('isDel', false);
//             userdoormap.set('start', new Date(2011, 1, 1));
//             userdoormap.set('day', new Date(2099, 11, 30));
//             userdoormap.set('user', user);
//             userdoormap.set('door', result.get('door'));
//             callback(null, userdoormap);
//         },function(err,doors){
//             AV.Object.saveAll(doors);
//             res.jsonp({ "data": [] });
//         });
//     });
// });

//审核申请
router.put('/employee/apply/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let doorarr = arr['data[' + id + '][door][]'];
    let user = AV.Object.createWithoutData('WxUser', id);
    let company = AV.Object.createWithoutData('Company', arr['data[' + id + '][companyId]']);
    if (typeof (company) != "undefined") {
        let emp = new Employee();
        emp.set('company', company);
        emp.set('user', user);
        emp.set('isDel', false);
        emp.save();
        user.fetch().then(function () {
            let audittime = new moment();
            let data = {
                touser: user.get('openid'), template_id: "VD8s8nNPftYihxT6h6Rt4oDVdibu3o7Cml7nwhvDCK4", url: '', "data": {
                    "first": {
                        "value": "您好，您的资料已经通过审核并已分配门禁权限。",
                        "color": "#44b549"
                    },
                    "keyword1": {
                        "value": user.get('name'),
                        "color": "#222"
                    },
                    "keyword2": {
                        "value": user.get('phone'),
                        "color": "#222"
                    },
                    "keyword3": {
                        "value": audittime.format('LLLL'),
                        "color": "#222"
                    },
                    "remark": {
                        "value": "汇金大厦欢迎您的入驻。",
                        "color": "#222"
                    }
                }
            };
            user.set('flag', 1);
            user.save().then(function () {
                if (typeof (doorarr) == "string") {
                    let door = AV.Object.createWithoutData('Door', doorarr);
                    let userdoormap = new UserDoorMap();
                    userdoormap.set('isDel', false);
                    userdoormap.set('start', new Date(2011, 1, 1));
                    userdoormap.set('day', new Date(2099, 11, 30));
                    userdoormap.set('user', user);
                    userdoormap.set('door', door);
                    userdoormap.save().then(function () {
                        getTokenAndSendMsg(data);
                        res.jsonp({ "data": [] });
                    });
                } else {
                    async.map(doorarr, function (one, callback) {
                        let door = AV.Object.createWithoutData('Door', one);
                        let userdoormap = new UserDoorMap();
                        userdoormap.set('isDel', false);
                        userdoormap.set('start', new Date(2011, 1, 1));
                        userdoormap.set('day', new Date(2099, 11, 30));
                        userdoormap.set('user', user);
                        userdoormap.set('door', door);
                        callback(null, userdoormap);
                    }, function (err, doors) {
                        AV.Object.saveAll(doors).then(function () {
                            getTokenAndSendMsg(data);
                            res.jsonp({ "data": [] });
                        });
                    });
                }
            });
        });
    } else {
        return res.jsonp({ "data": [], "fieldErrors": [{ "name": "company", "status": arr['data[' + id + '][company]'] + "未找到" }] });
    }
});
//驳回申请
router.delete('/employee/apply/remove/:id', function (req, res) {
    let id = req.params.id;
    let user = AV.Object.createWithoutData('WxUser', id);
    user.fetch().then(function () {
        let audittime = new moment();
        let data = {
            touser: user.get('openid'), template_id: "VD8s8nNPftYihxT6h6Rt4oDVdibu3o7Cml7nwhvDCK4", url: 'http://clouddoor.leanapp.cn/menu', "data": {
                "first": {
                    "value": "您好，您的资料未通过审核请重新填写信息。",
                    "color": "#44b549"
                },
                "keyword1": {
                    "value": user.get('name'),
                    "color": "#222"
                },
                "keyword2": {
                    "value": user.get('phone'),
                    "color": "#222"
                },
                "keyword3": {
                    "value": audittime.format('LLLL'),
                    "color": "#222"
                },
                "remark": {
                    "value": "点击前往注册。",
                    "color": "#222"
                }
            }
        };
        getTokenAndSendMsg(data);
        user.set('flag', -1);
        user.save().then(function () {
            res.jsonp({ "data": [] });
        });
    });
});
//门禁记录
router.get('/history', function (req, res) {
    let query = new AV.Query('History');
    query.include('user');
    query.include('door');
    query.limit(1000);
    query.descending('createdAt');
    query.find().then(function (results) {
        async.map(results, function (result, callback) {
            result.set('DT_RowId', result.id);
            result.set('name', result.get('user').get('name'));
            result.set('phone', result.get('user').get('phone'));
            result.set('number', result.get('door').get('number'));
            result.set('door', result.get('door').get('name'));
            let time = new moment(result.get('createdAt'));
            result.set('time', time.format('YYYY-MM-DD HH:mm:ss'));
            callback(null, result);
        }, function (err, data) {
            res.jsonp({ "data": data });
        });
    }, function (err) {
        console.log(err);
    });
});
//访客记录
router.get('/visitor', function (req, res) {
    let query = new AV.Query('Visit');
    query.include('user');
    query.include('company');
    query.include('interviewee');
    query.limit(1000);
    query.descending('createdAt');
    query.find().then(function (results) {
        async.map(results, function (result, callback) {
            result.set('DT_RowId', result.id);
            result.set('name', result.get('user').get('name'));
            result.set('phone', result.get('user').get('phone'));
            //result.set('number', result.get('company').get('number'));
            let time = new moment(result.get('day'));
            result.set('day', time.format('LLL'));
            result.set('target', result.get('target'));
            result.set('pass', result.get('pass') == 1 ? "通过" : "未通过");
            result.set('interviewee', result.get('interviewee').get('name'));
            let time1 = new moment(result.get('createdAt'));
            result.set('time', time1.format('YYYY-MM-DD HH:mm:ss'));
            callback(null, result);
        }, function (err, data) {
            res.jsonp({ "data": data });
        });
    }, function (err) {
        console.log(err);
    });
});

module.exports = router;
