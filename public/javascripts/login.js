$(function() {

	$('#to_sign_up').click(function() {
		$('#login').removeAttr('data-active')
		$('#sign_up').attr('data-active', true)
	})

	$('#to_login').click(function() {
		$('#sign_up').removeAttr('data-active')
		$('#login').attr('data-active', true)
	})

})