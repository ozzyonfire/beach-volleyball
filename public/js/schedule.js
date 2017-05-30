$(document).ready(function() {
	$('#scheduleTable').DataTable({
		pageLength: 50
	});

	$.get('/api/match', {name: 'Summer League'}).done(function(matches) {
		matches.forEach(function(match) {
			$('#row-'+match._id).click(function(e) {
				showScoreModal(match);
			});
		});
	});

	$('#matchModal_save').click(function(e) {
		$.ajax({
			url: '/api/match',
			method: 'put',
			data: $('#scoreForm').serialize()
		}).done(function(match) {
			console.log(match);
			$('#game1-'+match._id).text(match.game1.name);
			$('#game2-'+match._id).text(match.game2.name);
			$('#game3-'+match._id).text(match.game3.name);
		});
	});
});

function addOptions(selectId, match) {
	$('#'+selectId).append($('<option></option>')
		.prop('value', match.home._id).text(match.home.name));
	$('#'+selectId).append($('<option></option>')
		.prop('value', match.away._id).text(match.away.name));
}

function showScoreModal(match) {
	$('#matchModal_id').val(match._id);
	$('#game1-team').empty();
	$('#game2-team').empty();
	$('#game3-team').empty();
	addOptions('game1-team', match);
	addOptions('game2-team', match);
	addOptions('game3-team', match);
}