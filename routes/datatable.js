'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var moment = require('moment');

router.get('/company', function (req, res) {
    let resdata = {};
    let query=new AV.Query('Company');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        resdata["data"]=results;
        res.jsonp(resdata);
    });
});

router.get('/door', function (req, res) {
    let resdata = {};
    let query=new AV.Query('Door');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        resdata["data"]=results;
        res.jsonp(resdata);
    });
});

router.get('/employee', function (req, res) {
    let resdata = {};
    let query=new AV.Query('Employee');
    query.equalTo('isDel',false);
    query.include('company');
    query.include('user');
    query.find().then(function(results){
        async.map(results,function(result,callback){
            result.set('name',result.get('user').get('name'));
            result.set('phone',result.get('user').get('phone'));
            result.set('nickname',result.get('user').get('nickname'));
            result.set('floor',result.get('company').get('floor'));
            result.set('number',result.get('company').get('number'));
            result.set('company',result.get('company').get('name'));
            callback(null,result);
        },function(err,emps){
            resdata["data"]=emps;
            res.jsonp(resdata);
        });
    });
});

router.get('/company', function (req, res) {
    let resdata = {};
    let query=new AV.Query('Company');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        resdata["data"]=results;
        res.jsonp(resdata);
    });
});

module.exports = router;
