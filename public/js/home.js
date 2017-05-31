$(document).ready(function() {
	$('#weekSelect').change(function(e) {
		$.get('/api/match', {round: $('#weekSelect').val()})
			.done(function(matches) {
				$('#matchTableBody').empty();
				makeMatchTable(matches);
			});
	});

	$.get('/api/settings').done(function(settings) {
		$('#weekSelect').val(settings.currentWeek);
	});
});

function makeMatchTable(matches) {
	matches.forEach(function(match) {
		var row = $('<tr></tr>');

		var timeCol = $('<td></td>').text(match.time);
		var homeCol = $('<td></td>').text(match.home.name);
		var awayCol = $('<td></td>').text(match.away.name);

		row.append(timeCol);
		row.append(homeCol);
		row.append(awayCol);

		$('#matchTableBody').append(row);
	});
}