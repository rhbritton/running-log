$(function() {
	$('.today').change(function() {
		var d = $(this).val()
		if (d) {
			d = new Date(d);
			window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + '?today=' + (d.getUTCMonth()+1) + '/' + d.getUTCDate() + '/' + d.getUTCFullYear();
		} else {
			window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname;
		}
	})

	$('.day').click(function(e) {
		e.stopPropagation();
		
		var isactive = $(this).find('.run_data').attr('data-active');

		$('.day .run_data').each(function() {
			$(this).removeAttr('data-active');
		});

		if (!isactive)
			$(this).find('.run_data').attr('data-active', true);
	})

	$('body').click(function(e) {
		$('.day .run_data').each(function() {
			$(this).removeAttr('data-active');
		});
	})

	$('[name="goal"]').change(function() {
		var percentToGoal = 0;
		if ($('#totalMiles').text() && $(this).val())
			percentToGoal = 100*(parseFloat($('#totalMiles').text())/parseFloat($(this).val()));

		$('#percentToGoal').text(percentToGoal.toFixed(2)+'%');

		$.post('/update-goal', { goal: $(this).val(), startDate: $(this).attr('data-startDate') }, function(data) {
			console.log(data)
		});
	})

	$('.settings, .settings_notifications').click(function(e) {
		e.stopPropagation();

		let settings_dropdown = $('.settings_dropdown');
		var isActive = settings_dropdown.attr('data-active');

		if (isActive)
			settings_dropdown.removeAttr('data-active');
		else
			settings_dropdown.attr('data-active', true);
	})

	$('body').click(function(e) {
		$('.settings_dropdown').removeAttr('data-active');
	})


	$('[data-href]').click(function() {
		window.location.href = $(this).attr('data-href');
	});

	$('.delete').click(function(e) {
		var miles = $(this).attr('data-miles');
		var d = $(this).attr('data-date');
		var shouldDelete = confirm('Are you sure you want to delete your '+miles+' mile run on '+d+'?');

		if (!shouldDelete)
			e.preventDefault();
	})

})