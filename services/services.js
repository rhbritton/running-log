var Services = {};

Services.auth = function(req, res, next) {
    if (!req.session.user || !req.session.user._id)
        res.redirect('/login');
    else
        next();
};

Services.authJSON = function(req, res, next) {
    if (!req.session.user || !req.session.user._id)
        res.json({ err: 'Not Logged In' });
   	else
        next();
};

Services.formatTime = function(seconds) {
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

Services.includes = function(arr, matchVal) {
	var match = arr.some(function(val) {
		if (val == matchVal)
			return true;
	});

	return match;
}

Services.formatHTMLDate = function(date) {
	var m = date.getUTCMonth()+1;
	if ((date.getUTCMonth()+1) < 10)
		m = '0'+(date.getUTCMonth()+1);

	var d = date.getUTCDate();
	if (d < 10)
		d = '0'+d;

	return date.getUTCFullYear()+'-'+m+'-'+d;
}

Services.formatDisplayDate = function(date) {
	var m = date.getUTCMonth()+1;
	if ((date.getUTCMonth()+1) < 10)
		m = '0'+(date.getUTCMonth()+1);

	var d = date.getUTCDate();
	if (d < 10)
		d = '0'+d;

	return m+'/'+d+'/'+date.getUTCFullYear();
}

Services.addDays = function(date, days) {
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}

Services.calcMinsPerMile = function(miles, seconds) {
	var secPerMile = seconds/miles;

	var minutes = Math.floor(secPerMile/60);
	var remainingSecPerMile = Math.ceil(secPerMile % 60);
	if (remainingSecPerMile < 10)
		remainingSecPerMile = '0'+remainingSecPerMile;

	return minutes + ':' + remainingSecPerMile;
}

Services.getDateGroup = function(date) {
	var start_date = new Date(date);
	var end_date = new Date(date);

	if (date.getUTCDay() == 0) {
		start_date = Services.addDays(start_date, -6)
	} else if (date.getUTCDay() == 1) {
		start_date = Services.addDays(start_date, 0)
		end_date = Services.addDays(end_date, 6)
	} else if (date.getUTCDay() == 2) {
		start_date = Services.addDays(start_date, -1)
		end_date = Services.addDays(end_date, 5)
	} else if (date.getUTCDay() == 3) {
		start_date = Services.addDays(start_date, -2)
		end_date = Services.addDays(end_date, 4)
	} else if (date.getUTCDay() == 4) {
		start_date = Services.addDays(start_date, -3)
		end_date = Services.addDays(end_date, 3)
	} else if (date.getUTCDay() == 5) {
		start_date = Services.addDays(start_date, -4)
		end_date = Services.addDays(end_date, 2)
	} else if (date.getUTCDay() == 6) {
		start_date = Services.addDays(start_date, -5)
		end_date = Services.addDays(end_date, 1)
	}

	start_date.setHours(0, 0, 0, 0);
	end_date.setHours(23, 59, 59, 999);

	return {
		start_date: start_date,
		end_date: end_date
	}
}


module.exports = Services;