var Controller = {};

const saltRounds = 10;

var bcrypt = require('bcryptjs');
var moment = require('moment');

var User = require('../models/user');
var Run = require('../models/run');
var Goal = require('../models/goal');

var Services = require('../services/services');

Controller.home = function(req, res, next) {
	var today = new Date();
	if (req.query.today)
		today = new Date(req.query.today);

	today.setHours(0, 0, 0, 0);

	var dates = Services.getDateGroup(today);

	User.findOne({ _id: req.session.user._id }, function(err, user) {
		Run.find({ user: req.session.user._id, date: { $lte: dates.end_date, $gte: dates.start_date } }, undefined, { sort: { date: 1 } }, function(err, runs) {
			Goal.findOne({ user: req.session.user._id, start_date: Services.formatHTMLDate(dates.start_date) }, function(err, goal) {
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

				var showNotifications = false;
				if (user.requestsReceived.length)
					showNotifications = true;

				res.render('home', { 
					user: req.session.user, 
					showNotifications: showNotifications,
					friendRequestsLength: user.requestsReceived.length,
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

Controller.updateGoal = function(req, res, next) {
	Goal.findOne({ user: req.session.user._id, start_date: req.body.startDate }, function(err, goal) {
		if (goal) {
			Goal.update({ user: req.session.user._id, start_date: req.body.startDate }, { $set: { goal: req.body.goal } }, function(err, goal) {
				res.json({ test: goal });
			})
		} else {
			Goal.create({ user: req.session.user._id, start_date: req.body.startDate, goal: req.body.goal }, function(err, goal) {
				res.json({ test: goal });
			})
		}
	});
}

Controller.addRun = function(req, res, next) {
	var secondsDropdown = [];
	var minutesDropdown = [];
	var hoursDropdown = [];
	for (var i=0; i<60; i++) {
		secondsDropdown.push({ display: i+'s', value: i });
		minutesDropdown.push({ display: i+'m', value: i });
		hoursDropdown.push({ display: i+'h', value: i });
	}

	var today = new Date();
	today.setHours(0, 0, 0, 0);

	res.render('run', { user: req.session.user, today: Services.formatHTMLDate(today), redirect_url: encodeURI(req.header('Referer') || '/'), secondsDropdown: secondsDropdown, minutesDropdown: minutesDropdown, hoursDropdown: hoursDropdown });
}


Controller.addRunPost = function(req, res, next) {
	req.body.seconds = 0;
	if (req.body.h)
		req.body.seconds += parseInt(req.body.h)*3600;

	if (req.body.m)
		req.body.seconds += parseInt(req.body.m)*60;

	if (req.body.s)
		req.body.seconds += parseInt(req.body.s)

	var date = new Date(req.body.date);
	date.setHours(24, 0, 0, 0);

	Run.create({ 
		date: date,
		miles: req.body.miles,
		seconds: req.body.seconds,
		rpe: req.body.rpe,
		comment: req.body.comment,
		user: req.session.user._id
	}, function(err, run) {
		res.redirect(req.body.redirect_url || '/');
	})
}

Controller.editRun = function(req, res, next) {
	Run.findOne({ _id: req.params.id, user: req.session.user._id }, function(err, run) {
		run.dateFormat = Services.formatHTMLDate(run.date);

		run.h = Math.floor(run.seconds/3600);
		var remainingSeconds = run.seconds % 3600;
		run.m = Math.floor(remainingSeconds/60);
		remainingSeconds = remainingSeconds % 60;
		run.s = Math.floor(remainingSeconds);

		var secondsDropdown = [];
		var minutesDropdown = [];
		var hoursDropdown = [];
		for (var i=0; i<60; i++) {
			if (run.h == i)
				hoursDropdown.push({ selected: true, display: i+'h', value: i });
			else
				hoursDropdown.push({ display: i+'h', value: i });

			if (run.m == i)
				minutesDropdown.push({ selected: true, display: i+'m', value: i });
			else
				minutesDropdown.push({ display: i+'m', value: i });

			if (run.s == i)
				secondsDropdown.push({ selected: true, display: i+'s', value: i });
			else
				secondsDropdown.push({ display: i+'s', value: i });
		}

		res.render('run', { user: req.session.user, redirect_url: encodeURI(req.header('Referer') || '/'), run: run, secondsDropdown: secondsDropdown, minutesDropdown: minutesDropdown, hoursDropdown: hoursDropdown });
	});
}

Controller.editRunPost = function(req, res, next) {
	req.body.seconds = 0;
	if (req.body.h)
		req.body.seconds += parseInt(req.body.h)*3600;

	if (req.body.m)
		req.body.seconds += parseInt(req.body.m)*60;

	if (req.body.s)
		req.body.seconds += parseInt(req.body.s);

	var date = new Date(req.body.date);
	date.setHours(24, 0, 0, 0);

	Run.update({ _id: req.body._id, user: req.session.user._id }, { 
		$set: {
			date: date,
			miles: req.body.miles,
			seconds: req.body.seconds,
			rpe: req.body.rpe,
			comment: req.body.comment
		}
	}, function(err, run) {
		res.redirect(req.body.redirect_url || '/');
	});
}

Controller.deleteRun = function(req, res, next) {
	Run.remove({ _id: req.params.id }, function(err, run) {
		res.redirect(req.header('Referer') || '/');
	});
}

Controller.logout = function(req, res, next) {
	req.session.destroy();
	res.redirect('/login');
}

Controller.login = function(req, res, next) {
	if (req.session.user) return res.redirect('/');

	res.render('login', { isLogin: true, err: req.query.err });
}

Controller.loginPost = function(req, res, next) {
	if (!req.body.email)
		return res.render('login', { isLogin: true, err: 'Email is required', password: req.body.password });

	if (!req.body.password)
		return res.render('login', { isLogin: true, err: 'Password is required', email: req.body.email });

	// Check if user exists in database
	User.findOne({
		email: req.body.email
	}, function(err, user) {
		var correct_login = false;
		if (user)
			correct_login = bcrypt.compareSync(req.body.password, user.password);

		if (!correct_login)
			return res.render('login', { isLogin: true, err: 'Incorrect Email or Password', email: req.body.email });

		req.session.user = { _id: user._id, email: user.email }

		return res.redirect('/');
	});
}

Controller.signInPost = function(req, res, next) {
	if (!req.body.email)
		return res.render('login', { isSignUp: true, err: 'Email is required', password: req.body.password, rpassword: req.body.rpassword });

	if (!req.body.password)
		return res.render('login', { isSignUp: true, err: 'Password is required', email: req.body.email });

	if (!req.body.rpassword)
		return res.render('login', { isSignUp: true, err: 'Repeat Password is required', email: req.body.email });

	if (req.body.password != req.body.rpassword)
		return res.render('login', { isSignUp: true, err: 'Repeat Password should match Password', email: req.body.email });

	User.findOne({
		email: req.body.email
	}, function(err, user) {
		if (user)
			return res.render('login', { isSignUp: true, err: 'That email is already associated with an account', email: req.body.email });

		var salt = bcrypt.genSaltSync(saltRounds);
		var hash = bcrypt.hashSync(req.body.password, salt);

		User.create({
			email: req.body.email,
			password: hash
		}, function(err, created_user) {
			req.session.user = { _id: created_user._id, email: req.body.email }

			return res.redirect('/');
		});
	});
}

module.exports = Controller;