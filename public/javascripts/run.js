$(function() {

	$('.rpe_link').click(function() {
		$('.transparent_background').attr('data-active', true)
		$('.rpe_container').attr('data-active', true)
	})

	$('.close, .transparent_background, .rpe_container').click(function() {
		$('.transparent_background').removeAttr('data-active')
		$('.rpe_container').removeAttr('data-active')
	})

})