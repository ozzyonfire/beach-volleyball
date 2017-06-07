$(document).ready(function() {
	$.get('/api/calculate/stats').done(function(response) {
		console.log(response);
		$.get('/api/team').done(function(teams) {
			teams.forEach(function(team) {
				$('#row-'+team._id).click(function(e) {
					showTeamInfo(team);
					makeStatsTable(team);
				});
			});
		});
	});
});

function showTeamInfo(team) {
	var playerList = $('#playerList')
	playerList.empty();
	team.teammates.forEach(function(player) {
		playerList.append($('<li class="list-group-item"></li>').text(player.name));
	});
}

function makeStatsTable(team) {
	$('#wins-'+team._id).text(team.wins);
}