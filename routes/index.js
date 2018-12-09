var express = require('express');

var router = express.Router();

var Services = require('../services/services');

var Controller = require('../controllers/index');

router.get('/', Services.auth, Controller.home);

router.post('/update-goal', Controller.updateGoal);

router.get('/run/add', Services.auth, Controller.addRun);

router.post('/run/add', Services.auth, Controller.addRunPost);

router.get('/run/edit/:id', Services.auth, Controller.editRun);

router.post('/run/edit/:id', Services.auth, Controller.editRunPost);

router.get('/run/delete/:id', Services.auth, Controller.deleteRun);



router.get('/logout', Controller.logout);

router.get('/login', Controller.login);

router.post('/login', Controller.loginPost);

router.post('/sign-up', Controller.signInPost);

module.exports = router;
