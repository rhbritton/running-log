$(function() {

	$('.request_friend').click(function() {
		var email = $('#email').val();
		if (!email) 
			return;

		$('#email').val('');

		$.post('/friends/request-friend', { email: email }, function(data) {
			if (data.err)
				return $('.err').html('<span class="err_text">'+data.err+'</span>');

			$('.request_list').append(`
				<tr>
	                <td>`+email+`</td>
	                <td>Sent</td>
	                <td></td>
	            </tr>
	        `);
		});
	})

	$('.accept_friend').click(function() {
		var $this = $(this);
		var _id = $this.attr('data-potentialFriend');
		var email = $this.attr('data-email');
		$this.parent().parent().remove();

		$('.friends_list').append(`
			<td>`+email+`</td>
            <td><a href="/friends/view/`+_id+`">View Progress</a></td>
        `);

		$.post('/friends/accept-friend-request', { potentialFriend: _id }, function(data) {
			console.log(data)
		});
	})

})