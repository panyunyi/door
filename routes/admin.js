'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var Todo = AV.Object.extend('Todo');

router.get('/', function (req, res) {
    if (req.currentUser) {
        let flag = 0;
        if (req.currentUser.get('username') == "admin") {
            flag = 1;
        }
        res.render('index', { flag: flag });
    } else {
        res.redirect('../login');
    }
});

router.get('/company', function (req, res) {
    if (req.currentUser) {
        let flag = 0;
        if (req.currentUser.get('username') == "admin") {
            flag = 1;
        }
        res.render('company', { flag: flag });
    } else {
        res.redirect('../login');
    }
});

router.get('/door', function (req, res) {
    if (req.currentUser) {
        let flag = 0;
        if (req.currentUser.get('username') == "admin") {
            flag = 1;
        }
        res.render('door', { flag: flag });
    } else {
        res.redirect('../login');
    }
});

router.get('/employee', function (req, res) {
    if (req.currentUser) {
        let flag = 0;
        if (req.currentUser.get('username') == "admin") {
            flag = 1;
        }
        res.render('employee', { flag: flag });
    } else {
        res.redirect('../login');
    }
});

router.get('/visitor', function (req, res) {
    if (req.currentUser) {
        let flag = 0;
        if (req.currentUser.get('username') == "admin") {
            flag = 1;
        }
        res.render('visitor', { flag: flag });
    } else {
        res.redirect('../login');
    }
});

router.get('/history', function (req, res) {
    if (req.currentUser) {
        let flag = 0;
        if (req.currentUser.get('username') == "admin") {
            flag = 1;
        }
        res.render('history', { flag: flag });
    } else {
        res.redirect('../login');
    }
});

module.exports = router;
