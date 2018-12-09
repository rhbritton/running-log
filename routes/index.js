var express = require('express');
var bcrypt = require('bcryptjs');
var moment = require('moment');

var User = require('../models/user');
var Run = require('../models/run');
var Goal = require('../models/goal');

var router = express.Router();

const saltRounds = 10;

var auth = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
};

var formatTime = function(seconds) {
	var h = Math.floor(seconds/3600);
	var remainingSeconds = seconds % 3600;
	var m = Math.floor(remainingSeconds/60);
	remainingSeconds = remainingSeconds % 60;
	var s = Math.floor(remainingSeconds);

	var display = '';

	if (h) {
		display += h+'h '+m+'m '+s+'s';
	} else if (m) {
		display += m+'m '+s+'s';
	} else {
		display += s+'s';
	}

	return display;
};

var formatHTMLDate = function(date) {
	var m = date.getUTCMonth()+1;
	if ((date.getUTCMonth()+1) < 10)
		m = '0'+(date.getUTCMonth()+1);

	var d = date.getUTCDate();
	if (d < 10)
		d = '0'+d;

	return date.getUTCFullYear()+'-'+m+'-'+d;
}

var formatDisplayDate = function(date) {
	var m = date.getUTCMonth()+1;
	if ((date.getUTCMonth()+1) < 10)
		m = '0'+(date.getUTCMonth()+1);

	var d = date.getUTCDate();
	if (d < 10)
		d = '0'+d;

	return m+'/'+d+'/'+date.getUTCFullYear();
}

var addDays = function(date, days) {
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}

var calcMinsPerMile = function(miles, seconds) {
	var secPerMile = seconds/miles;

	var minutes = Math.floor(secPerMile/60);
	var remainingSecPerMile = Math.ceil(secPerMile % 60);
	if (remainingSecPerMile < 10)
		remainingSecPerMile = '0'+remainingSecPerMile;

	return minutes + ':' + remainingSecPerMile;
}

var getDateGroup = function(date) {
	var start_date = new Date(date);
	var end_date = new Date(date);

	if (date.getUTCDay() == 0) {
		start_date = addDays(start_date, -6)
	} else if (date.getUTCDay() == 1) {
		start_date = addDays(start_date, 0)
		end_date = addDays(end_date, 6)
	} else if (date.getUTCDay() == 2) {
		start_date = addDays(start_date, -1)
		end_date = addDays(end_date, 5)
	} else if (date.getUTCDay() == 3) {
		start_date = addDays(start_date, -2)
		end_date = addDays(end_date, 4)
	} else if (date.getUTCDay() == 4) {
		start_date = addDays(start_date, -3)
		end_date = addDays(end_date, 3)
	} else if (date.getUTCDay() == 5) {
		start_date = addDays(start_date, -4)
		end_date = addDays(end_date, 2)
	} else if (date.getUTCDay() == 6) {
		start_date = addDays(start_date, -5)
		end_date = addDays(end_date, 1)
	}

	start_date.setHours(0, 0, 0, 0);
	end_date.setHours(23, 59, 59, 999);

	return {
		start_date: start_date,
		end_date: end_date
	}
}

router.get('/', auth, function(req, res, next) {
	var today = new Date();
	if (req.query.today)
		today = new Date(req.query.today);

	today.setHours(0, 0, 0, 0);

	var dates = getDateGroup(today);

	Run.find({ user: req.session.user._id, date: { $lte: dates.end_date, $gte: dates.start_date } }, undefined, { sort: { date: 1 } }, function(err, runs) {
		Goal.findOne({ user: req.session.user._id, start_date: formatHTMLDate(dates.start_date) }, function(err, goal) {
			console.log(goal)
			if (!goal)
				goal = {};

			var totals = {
				miles: 0,
				seconds: 0,
				minPerMile: 0,
				rpe: 0,
				srpe: 0
			}

			runs.forEach(function(run, i) {
				runs[i].dateFormat = formatDisplayDate(run.date);
				runs[i].time = formatTime(run.seconds);
				runs[i].minPerMile = calcMinsPerMile(run.miles, run.seconds);
				runs[i].srpe = run.miles*run.rpe;

				totals.miles += run.miles;
				totals.seconds += run.seconds;
				totals.rpe += run.rpe;
				totals.srpe += run.srpe;
			});

			totals.time = formatTime(totals.seconds);

			if (totals.miles && totals.seconds)
				totals.minPerMile = calcMinsPerMile(totals.miles, totals.seconds);
			else
				totals.minPerMile = '0:00';

			var percentToGoal = 0;
			if (goal.goal)
				percentToGoal = (100*(totals.miles/goal.goal)).toFixed(2);

			res.render('home', { 
				user: req.session.user, 
				percentToGoal: percentToGoal, 
				goal: goal.goal, 
				totals: totals, 
				runs: runs, 
				today: formatHTMLDate(today), 
				startDateHTML: formatHTMLDate(dates.start_date), 
				startDateDisplay: formatDisplayDate(dates.start_date), 
				endDateDisplay: formatDisplayDate(dates.end_date) 
			});
		});
	});
});

router.post('/update-goal', function(req, res, next) {
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
});

router.get('/run/add', auth, function(req, res, next) {
	var secondsDropdown = [];
	var minutesDropdown = [];
	var hoursDropdown = [];
	for (var i=0; i<60; i++) {
		secondsDropdown.push({ display: i+'s', value: i });
		minutesDropdown.push({ display: i+'m', value: i });
		hoursDropdown.push({ display: i+'h', value: i });
	}

	res.render('run', { user: req.session.user, today: formatHTMLDate(new Date()), redirect_url: encodeURI(req.header('Referer') || '/'), secondsDropdown: secondsDropdown, minutesDropdown: minutesDropdown, hoursDropdown: hoursDropdown });
});

router.post('/run/add', auth, function(req, res, next) {
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
});

router.get('/run/edit/:id', auth, function(req, res, next) {
	Run.findOne({ _id: req.params.id, user: req.session.user._id }, function(err, run) {
		run.dateFormat = formatHTMLDate(run.date);

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
});

router.post('/run/edit/:id', auth, function(req, res, next) {
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
});

router.get('/run/delete/:id', auth, function(req, res, next) {
	Run.remove({ _id: req.params.id }, function(err, run) {
		res.redirect(req.header('Referer') || '/');
	});
});



router.get('/logout',  function(req, res, next) {
	req.session.destroy();
	res.redirect('/login');
});

router.get('/login', function(req, res, next) {
	if (req.session.user) return res.redirect('/');

	res.render('login', { isLogin: true, err: req.query.err });
});

router.post('/login', function(req, res, next) {
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
});

router.post('/sign-up', function(req, res, next) {
	if (!req.body.email)
		return res.render('login', { isSignUp: true, err: 'Email is required', password: req.body.password, rpassword: req.body.rpassword });

	if (!req.body.password)
		return res.render('login', { isSignUp: true, err: 'Password is required', email: req.body.email });

	if (!req.body.rpassword)
		return res.render('login', { isSignUp: true, err: 'Repeat Password is required', email: req.body.email });

	if (req.body.password != req.body.rpassword)
		return res.render('login', { isSignUp: true, err: 'Repeat Password should match Password', email: req.body.email });

	console.log('test')
	User.findOne({
		email: req.body.email
	}, function(err, user) {
		console.log(err)
		if (user)
			return res.render('login', { isSignUp: true, err: 'That email is already associated with an account', email: req.body.email });

		var salt = bcrypt.genSaltSync(saltRounds);
		var hash = bcrypt.hashSync(req.body.password, salt);

		User.create({
			email: req.body.email,
			password: hash
		}, function(err, created_user) {
			console.log(err)
			req.session.user = { _id: created_user._id, email: req.body.email }

			return res.redirect('/');
		});
	});
});

module.exports = router;
