$(document).ready(function() {

	// Settings Tab
	$.get('/api/tournament').done(function(tournaments) {
		tournaments.forEach(function(tourny) {
			$('#currentTournament').append($('<option></option>').prop('value', tourny._id).text(tourny.name));
		});
	});

	$.get('/api/settings').done(function(settings) {
		$('#currentWeek').val(settings.currentWeek);
		$('#currentTournament').val(settings.currentTournament);
	});

	$('#currentTournament').change(function(e) {
		sendSettingsForm();
	});

	$('#currentWeek').change(function(e) {
		sendSettingsForm();
	});

	// Tournament Tab
	$('#addTournamentButton').click(function(e) {
		$.post('/api/tournament', $('#tournamentForm').serialize())
			.done(function(tourny) {
				$('#tournaments').append($('<option></option>').prop('value',tourny._id).text(tourny.name));
			});
	});

	// Team Tab
	$('#teamPanelButton').click(function(e) {
		$('#teamGroup').empty();
		$.get('/api/team').done(function(teams) {
			teams.forEach(function(team) {
				addTeamButton(team);
			});
		});
	});

	$(document).on('click', '#addTeamButton', function(e) {
		var blankTeam = {
			name: '',
			team: '',
			teammates: [],
		};
		showTeamModal(blankTeam);
	});

	$('#teamModal_save').click(function(e) {
		$.ajax({
			url:'/api/team', 
			data: $('#teamForm').serialize(),
			method: 'put'
		}).done(function(team) {
			var id = team._id;
			if (team.isNew) {
				addTeamButton(team);
			} else {
				$('#'+id+'_list').click(function(e) {
					showTeamModal(team);
				});
				$('#'+id+'_list').text(team.name);
			}
		});
	});

	$('#teamModal_remove').click(function(e) {
		$.ajax({
			url: '/api/team',
			method: 'delete',
			data: $('#teamForm').serialize()
		}).done(function(team) {
			$('#'+team._id+'_list').remove();
		});
	});

	// Matches Tab
	var currentTourny = $('#tournaments').val();
	populateMatches(currentTourny);

	$('#addMatchButton').click(function(e) {
		showMatchModal({
			home: {},
			away: {}
		});
	});

	$('#generateRoundRobinButton').click(function(e) {
		var id = $('#tournaments').val();
		$.get('api/generate/roundrobin', {id : id})
			.done(function(tourny) {
				populateMatches(id);
			});
	});

	$('#matchModal_remove').click(function(e) {
		$.ajax({
			url: '/api/match',
			data: $('#matchForm').serialize(),
			method: 'delete'
		}).done(function(match) {
			$('#'+match._id+'_row').remove();
		});
	});

	$('#matchModal_save').click(function(e) {
		$.ajax({
			url: '/api/match',
			method: 'put',
			data: $('#matchForm').serialize()
		}).done(function(match) {
			if (match.isNew) {
				addMatchTable(match);
			} else {
				$('#round-'+match._id).text(match.round);
				if (match.home) {
					$('#home-'+match._id).text(match.home.name);
				}
				if (match.away) {
					$('#away-'+match._id).text(match.away.name);
				}
				if (match.date) {
					$('#date-'+match._id).text(match.date.substring(0,10));
				}
				$('#time-'+match._id).text(match.time);

				$('#row-'+match._id).click(function(e) {
					showMatchModal(match);
				});
			}
		});
	});

	// Players Tab
	$('#playerModal_save').click(function(e) {
		$.ajax({
			url : '/api/player', 
			data: $('#playerForm').serialize(),
			method: 'put'
	}).done(function(player) {
			if (player.isNew) {
				addPlayerToList(player);
			} else {
				$('#row-'+player._id).click(function(e) {
					populatePlayerForm(player);
				});
			}
		});
	});

	$('#playerModal_remove').click(function(e) {
		$.ajax({
			url: '/api/player',
			data: $('#playerForm').serialize(),
			method: 'delete'
		}).done(function(member) {
			$('#'+member._id).remove();
		});
	});

	$(document).on('click', '#addPlayerButton', function(e) {
		var blankPlayer = {
			name: '',
			email: '',
			team: '',
			paid: false,
			_id: ''
		};
		populatePlayerForm(blankPlayer);
	});

	$.get('/api/player').done(function(players) {
		players.forEach(function(player) {
			addPlayerToList(player);
		});
	});
});

// Functions
function sendSettingsForm() {
	$.ajax({
		url: '/api/settings',
		method: 'put',
		data: $('#settingsForm').serialize()
	}).done(function(settings) {
		console.log(settings);
	});
}

function addPlayerToList(player) {
	var row = $('<tr></tr>');
	var nameCol = $('<td></td>').text(player.name);
	var paidCol = $('<td></td>').text(player.paid);

	row.attr('data-toggle','modal');
	row.attr('data-target','#playerModal');
	row.prop('id', 'row-'+player._id);
	row.append(nameCol);
	row.append(paidCol);

	row.click(function(e) {
		populatePlayerForm(player);
	});

	$('#playerGroup').append(row);
}

function populatePlayerForm(player) {
	// populate the form with this info
	$('#player-name').val(player.name);
	$('#email').val(player.email);
	if (player.paid)
		$('#paid').prop('checked', player.paid);
	else
		$('#paid').prop('checked', false);
	if (player.name !== '')
		$('#playerModal_label').text(player.name);
	else
		$('#playerModal_label').text('New Player');
	if (player._id)
		$('#playerModal_remove').prop('disabled', '');
	else
		$('#playerModal_remove').prop('disabled', 'disabled');
	$('#playerModal_id').val(player._id);
	$('#player-team').val(player.team);
}

function showTeamModal(team) {
	$('#teamName').val(team.name);
	$('#tournament').val(team.tournament);
	$('#teammateGroup').empty();
	team.teammates.forEach(function(mate) {
		$('#teammateGroup').append($('<li class="list-group-item"></li>').text(mate.name));
	});
	$('#teamModal_id').val(team._id);
	if (team._id != '' || team._id != undefined)
		$('#teamModal_remove').prop('disabled', '');
	else
		$('#teamModal_remove').prop('disabled', 'disabled');
}

function populateMatches(id) {
	$('matchTableBody').empty();
	$.get('/api/tournament', {id: id}).done(function(tourny) {
		// populate the matches
		tourny.matches.forEach(function(match) {
			addMatchTable(match);
		});
	});
}

function saveTeam(team) {
	var id = team._id;
	$.ajax({
		url: "/api/team",
		method: 'put',
		data: $('#'+id+'_form').serialize() 
	}).done(function(team) {
		// update the modal forms with the new info
		$('#'+id+'_teamName').text(team.name);
		var teammatesTextarea = $('#'+id+'_teammates');
		teammatesTextarea.empty();
		team.teammates.forEach(function(member) {
			teammatesTextarea.append(member + '\n');
		});

		// update the team name in the list
		$('#'+id+'_list').text(team.name);

		// update the team names in the match list
		$('#home').append($('<option></option>').text(team.name).prop('value', team._id));
		$('#away').append($('<option></option>').text(team.name).prop('value', team._id));
	});
}

function deleteTeam(team) {
	var id = team._id;
	$.ajax({
		url: '/api/team',
		method: 'delete',
		data: $('#'+id+'_form').serialize()
	}).done(function(response) {
		$('#'+id+'_list').remove();
	});
}

function addMatchTable(match) {
	var tableBody = $('#matchTableBody');

	var matchRow = $('<tr></tr>').attr('data-toggle','modal').attr('data-target','#matchModal');
	matchRow.prop('id', 'row-'+match._id);
	var roundCol = $('<td id="round-'+match._id+'"></td>').text(match.round);
	var homeCol = $('<td id="home-'+match._id+'"></td>').text(match.home.name);
	var awayCol = $('<td id="away-'+match._id+'"></td>').text(match.away.name);
	var dateCol = $('<td id="date-'+match._id+'"></td>');
	if (match.date) {
		dateCol.text(match.date.substring(0,10));
	}
	var timeCol = $('<td id="time-'+match._id+'"></td>').text(match.time);

	matchRow.append(roundCol);
	matchRow.append(homeCol);
	matchRow.append(awayCol);
	matchRow.append(dateCol);
	matchRow.append(timeCol);

	matchRow.click(function(e) {
		showMatchModal(match);
	});

	tableBody.append(matchRow);
}

function showMatchModal(match) {
	if (match._id != '' || match._id != undefined)
		$('#matchModal_label').text(match.home.name + ' vs. ' + match.away.name);
	else
		$('#matchModal_label').text('New Match');
	$('#round').val(match.round);
	$('#home').val(match.home._id);
	$('#away').val(match.away._id);
	if (match.date)
		$('#date').val(match.date.substring(0,10));
	else
		$('#date').val('');
	$('#time').val(match.time);
	$('#matchModal_id').val(match._id);
	if (match._id != '' || match._id != undefined)
		$('#matchModal_remove').prop('disabled', '');
	else
		$('#matchModal_remove').prop('disabled', 'disabled');
}

function addTeamButton(team) {
	var button = $('<button></button>').addClass('list-group-item');
	button.prop('type', 'button').attr('data-toggle','modal');
	button.attr('data-target','#teamModal').text(team.name);
	button.prop('id', team._id+'_list');

	button.click(function(e) {
		showTeamModal(team);
	});

	$('#teamGroup').append(button);
}