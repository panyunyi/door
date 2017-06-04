'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var Todo = AV.Object.extend('Todo');

router.get('/', function(req, res) {
    if(req.currentUser){
    	res.render('index');
    }else{
    	res.redirect('../login');
    }
});

router.get('/company', function(req, res) {
    if(req.currentUser){
    	res.render('company');
    }else{
    	res.redirect('../login');
    }
});

router.get('/door', function(req, res) {
    if(req.currentUser){
    	res.render('door');
    }else{
    	res.redirect('../login');
    }
});

router.get('/employee', function(req, res) {
    if(req.currentUser){
    	res.render('employee');
    }else{
    	res.redirect('../login');
    }
});

router.get('/visitor', function(req, res) {
    if(req.currentUser){
    	res.render('visitor');
    }else{
    	res.redirect('../login');
    }
});

module.exports = router;
