var express = require('express');
var router = express.Router();

var Controller = require('../controllers/friends');

var Services = require('../services/services');

router.get('/', Services.auth, Controller.friendsList);

router.get('/view/:id', Services.auth, Controller.viewFriend);

router.post('/request-friend', Services.auth, Controller.requestFriend);

router.post('/accept-friend-request', Services.auth, Controller.acceptFriend);

module.exports = router;
