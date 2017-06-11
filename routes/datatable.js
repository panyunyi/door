'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var moment = require('moment');
moment.locale('zh-cn');

router.get('/company', function (req, res) {
    let query = new AV.Query('Company');
    query.equalTo('isDel', false);
    query.find().then(function (results) {
        async.map(results, function (result, callback) {
            result.set('DT_RowId', result.id);
            callback(null, result);
        }, function (err, data) {
            res.jsonp({ "data": data });
        });
    });
});

var Company = AV.Object.extend('Company');
router.post('/company/add', function (req, res) {
    let arr = req.body;
    let company = new Company();
    company.set('name', arr['data[0][name]']);
    company.set('floor', arr['data[0][floor]'] ? arr['data[0][floor]'] * 1 : 0);
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

router.put('/company/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let company = AV.Object.createWithoutData('Company', id);
    company.set('name', arr['data[' + id + '][name]']);
    company.set('floor', arr['data[' + id + '][floor]'] ? arr['data[' + id + '][floor]'] * 1 : 0);
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

router.delete('/company/remove/:id', function (req, res) {
    let id = req.params.id;
    let company = AV.Object.createWithoutData('Company', id);
    company.set('isDel', true);
    company.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

router.get('/door', function (req, res) {
    let query = new AV.Query('Door');
    query.equalTo('isDel', false);
    query.find().then(function (results) {
        async.map(results, function (result, callback) {
            result.set('DT_RowId', result.id);
            callback(null, result);
        }, function (err, data) {
            res.jsonp({ "data": data });
        });
    });
});

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

router.delete('/door/remove/:id', function (req, res) {
    let id = req.params.id;
    let door = AV.Object.createWithoutData('Door', id);
    door.set('isDel', true);
    door.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

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

var UserDoorMap = AV.Object.extend('UserDoorMap');
router.post('/userdoormap/add', function (req, res) {
    let arr = req.body;
    let userdoormap = new UserDoorMap();
    let user = AV.Object.createWithoutData('WxUser', arr['data[0][user]']);
    let door = AV.Object.createWithoutData('Door', arr['data[0][doorid]']);
    userdoormap.set('user', user);
    userdoormap.set('door', door);
    userdoormap.set('start',new Date(2015,1,1));
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
});

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

router.delete('/userdoormap/remove/:id', function (req, res) {
    let id = req.params.id;
    let userdoormap = AV.Object.createWithoutData('UserDoorMap', id);
    userdoormap.set('isDel', true);
    userdoormap.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

router.get('/employee', function (req, res) {
    let resdata = {};
    function promise1(callback) {
        let query = new AV.Query('Employee');
        query.equalTo('isDel', false);
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

router.delete('/employee/remove/:id', function (req, res) {
    let id = req.params.id;
    let emp = AV.Object.createWithoutData('Employee', id);
    emp.set('isDel', true);
    emp.save().then(function () {
        emp.fetch().then(function () {
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

router.get('/employee/apply', function (req, res) {
    let resdata = {};
    function promise1(callback) {
        let query = new AV.Query('WxUser');
        query.equalTo('flag', 0);
        query.find().then(function (results) {
            async.map(results, function (result, callback1) {
                result.set('DT_RowId', result.id);
                result.set('company', result.get('company') ? result.get('company') : "");
                result.set('door', result.get('door') ? result.get('door') : "");
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
    ], function (err, results) {
        resdata["options"] = Object.assign({ "userdoormap": results[1] });
        res.jsonp(resdata);
    });
});

var Employee = AV.Object.extend('Employee');
router.put('/employee/apply/edit/:id', function (req, res) {
    let arr = req.body;
    let id = req.params.id;
    let doorarr = arr['data[' + id + '][userdoormap][]'];
    console.log(typeof (doorarr));
    let user = AV.Object.createWithoutData('WxUser', id);
    let companyQuery = new AV.Query('Company');
    companyQuery.equalTo('number', arr['data[' + id + '][door]']);
    companyQuery.first().then(function (company) {
        if (typeof (company) != "undefined") {
            let emp = new Employee();
            emp.set('company', company);
            emp.set('user', user);
            emp.set('isDel', false);
            user.set('flag', 1);
            user.save();
            emp.save();
            if (typeof (doorarr) == "string") {
                let door = AV.Object.createWithoutData('Door', doorarr);
                let userdoormap = new UserDoorMap();
                userdoormap.set('isDel', false);
                userdoormap.set('start',new Date(2011,1,1));
                userdoormap.set('day', new Date(2099, 11, 30));
                userdoormap.set('user', user);
                userdoormap.set('door', door);
                userdoormap.save();
                res.jsonp({ "data": [] });
            } else {
                async.map(doorarr, function (one, callback) {
                    let door = AV.Object.createWithoutData('Door', one);
                    let userdoormap = new UserDoorMap();
                    userdoormap.set('isDel', false);
                    userdoormap.set('start',new Date(2011,1,1));
                    userdoormap.set('day', new Date(2099, 11, 30));
                    userdoormap.set('user', user);
                    userdoormap.set('door', door);
                    callback(null, userdoormap);
                }, function (err, doors) {
                    AV.Object.saveAll(doors);
                    res.jsonp({ "data": [] });
                });
            }
        } else {
            return res.jsonp({ "data": [], "fieldErrors": [{ "name": "door", "status": arr['data[' + id + '][door]'] + "门牌号未找到存在" }] });
        }
    });
});

router.delete('/employee/apply/remove/:id', function (req, res) {
    let id = req.params.id;
    let user = AV.Object.createWithoutData('WxUser', id);
    user.set('flag', -1);
    user.save().then(function () {
        res.jsonp({ "data": [] });
    });
});

router.get('/history', function (req, res) {
    let query = new AV.Query('History');
    query.include('user');
    query.include('door');
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

router.get('/visitor', function (req, res) {
    let query = new AV.Query('Visit');
    query.include('user');
    query.include('company');
    query.include('interviewee');
    query.find().then(function (results) {
        async.map(results, function (result, callback) {
            result.set('DT_RowId', result.id);
            result.set('name', result.get('user').get('name'));
            result.set('phone', result.get('user').get('phone'));
            result.set('number', result.get('company').get('number'));
            let time = new moment(result.get('day'));
            result.set('day', time.format('LL'));
            result.set('company', result.get('company').get('name'));
            result.set('pass', result.get('pass') == 1 ? "通过" : "未通过");
            result.set('interviewee', result.get('interviewee').get('name'));
            callback(null, result);
        }, function (err, data) {
            res.jsonp({ "data": data });
        });
    }, function (err) {
        console.log(err);
    });
});

module.exports = router;
