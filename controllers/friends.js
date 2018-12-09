var Controller = {};

const saltRounds = 10;

var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var User = require('../models/user');
var Run = require('../models/run');
var Goal = require('../models/goal');

var Services = require('../services/services');

Controller.friendsList = function(req, res, next) {
	User.findOne({ _id: req.session.user._id }, undefined, { populate: 'requestsReceived requestsSent friends' }, function(err, user) {
		res.render('friends/index', { requestsReceived: user.requestsReceived, requestsSent: user.requestsSent, friends: user.friends });
	})
}

Controller.viewFriend = function(req, res, next) {
	var today = new Date();
	if (req.query.today)
		today = new Date(req.query.today);

	today.setHours(0, 0, 0, 0);

	User.findOne({ _id: req.params.id }, function(err, friend) {
		var dates = Services.getDateGroup(today);

		Run.find({ user: req.params.id, date: { $lte: dates.end_date, $gte: dates.start_date } }, undefined, { sort: { date: 1 } }, function(err, runs) {
			Goal.findOne({ user: req.params.id, start_date: Services.formatHTMLDate(dates.start_date) }, function(err, goal) {
				if (!goal)
					goal = {};

				var totals = {
					miles: 0,
					seconds: 0,
					minPerMile: 0,
					rpe: 0,
					srpe: 0
				}

				runs && runs.forEach(function(run, i) {
					runs[i].dateFormat = Services.formatDisplayDate(run.date);
					runs[i].time = Services.formatTime(run.seconds);
					runs[i].minPerMile = Services.calcMinsPerMile(run.miles, run.seconds);
					runs[i].srpe = run.miles*run.rpe;

					totals.miles += run.miles;
					totals.seconds += run.seconds;
					totals.rpe += run.rpe;
					totals.srpe += run.srpe;
				});

				totals.time = Services.formatTime(totals.seconds);

				if (totals.miles && totals.seconds)
					totals.minPerMile = Services.calcMinsPerMile(totals.miles, totals.seconds);
				else
					totals.minPerMile = '0:00';

				var percentToGoal = 0;
				if (goal.goal)
					percentToGoal = (100*(totals.miles/goal.goal)).toFixed(2);

				res.render('home', { 
					user: req.session.user, 
					friend: friend, 
					percentToGoal: percentToGoal, 
					goal: goal.goal, 
					totals: totals, 
					runs: runs, 
					today: Services.formatHTMLDate(today), 
					startDateHTML: Services.formatHTMLDate(dates.start_date), 
					startDateDisplay: Services.formatDisplayDate(dates.start_date), 
					endDateDisplay: Services.formatDisplayDate(dates.end_date) 
				});
			});
		});
	})
}

Controller.requestFriend = function(req, res, next) {
	User.findOne({ email: req.body.email }, function(err, potentialFriend) {
		if (err) 
			return res.json({ err: 'Database Error' });

		if (!potentialFriend) 
			return res.json({ err: req.body.email+' does not exist' });

		var potentialFriendFriends = [];
		potentialFriend.friends && potentialFriend.friends.forEach(function(request) {
			potentialFriendFriends.push(request+'');
		});

		return res.json({ err: (([]).includes)+'' });

		if ((potentialFriendFriends || []).includes(req.session.user._id+''))
			return res.json({ err: 'You are already friends with '+potentialFriend.email });

		// var potentialFriendRequestsReceived = [];
		// potentialFriend.requestsReceived && potentialFriend.requestsReceived.forEach(function(request) {
		// 	potentialFriendRequestsReceived.push(request.toString());
		// });

		// if (potentialFriendRequestsReceived.includes(req.session.user._id.toString())) 
		// 	return res.json({ err: potentialFriend.email+' has already received your friend request' });

		// User.findOne({ _id: req.session.user._id }, function(err, user) {
		// 	if (err) 
		// 		return res.json({ err: 'Database Error' });

		// 	var userRequestsReceived = [];
		// 	user.requestsReceived && user.requestsReceived.forEach(function(request) {
		// 		userRequestsReceived.push(request.toString());
		// 	});

		// 	if (userRequestsReceived.includes(potentialFriend._id.toString())) 
		// 		return res.json({ err: 'You have already received a friend request from '+potentialFriend.email });

		// 	User.update({ _id: potentialFriend._id }, { $push: { requestsReceived: req.session.user._id } }, function(err) {
		// 		if (err) 
		// 			return res.json({ err: 'Database Error' });

		// 		User.update({ _id: req.session.user._id }, { $push: { requestsSent: potentialFriend._id } }, function(err) {
		// 			if (err) 
		// 				return res.json({ err: 'Database Error' });

		// 			var request = {
		// 				email: potentialFriend.email
		// 			};

		// 			res.json({ request: request });
		// 		})
		// 	})
		// });
	});
}

Controller.acceptFriend = function(req, res, next) {
	User.findOne({ _id: req.session.user._id }, function(err, user) {
		if (err || !user) 
			return res.json({ err: 'Database Error' });

		var requestsReceived = [];
		user.requestsReceived && user.requestsReceived.forEach(function(request) {
			requestsReceived.push(request.toString());
		});

		if (!requestsReceived.includes(req.body.potentialFriend))
			return res.json({ err: 'That User did not send a request' })

		User.update({ _id: req.body.potentialFriend }, { $pull: { requestsSent: user._id }, $push: { friends: user._id } }, function(err) {
			if (err) 
				return res.json({ err: 'Database Error' });

			User.update({ _id: user._id }, { $pull: { requestsReceived: req.body.potentialFriend }, $push: { friends: req.body.potentialFriend } }, function(err) {
				if (err) 
					return res.json({ err: 'Database Error' });

				res.json({});
			})
		})
	})
}

module.exports = Controller;