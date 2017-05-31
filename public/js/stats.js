$(document).ready(function() {
	$.get('/api/team').done(function(teams) {
		teams.forEach(function(team) {
			$('#row-'+team._id).click(function(e) {
				showTeamInfo(team);
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