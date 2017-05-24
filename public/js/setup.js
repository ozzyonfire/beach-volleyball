$(document).ready(function() {

	// Tournament Tab
	$('#addTournamentButton').click(function(e) {
		$.post('/api/tournament', $('#tournamentForm').serialize())
			.done(function(tourny) {
				$('#tournaments').append($('<option></option>').prop('value',tourny._id).text(tourny.name));
			});
	});

	// Team Tab
	$('#teamModal_save').click(function(e) {
		$.post('/api/team', $('#teamForm').serialize())
			.done(function(team) {
				addTeamButtonAndModal(team);
			});
	});

	$.get('/api/team').done(function(teams) {
		teams.forEach(function(team) {
			var id = team._id;

			// modal button
			$('#'+id+'_list').click(function(e) {
				showTeamModal(team);
			});

			// save button
			$('#'+id+'_save').click(function(e) {
				saveTeam(team);
			});

			// delete button
			$('#'+id+'_remove').click(function(e) {
				deleteTeam(team);
			});
		});
	});

	// Matches Tab
	var currentTourny = $('#tournaments').val();
	populateMatches(currentTourny);

	$('#addMatchButton').click(function(e) {
		$.post('/api/match', $('#matchForm').serialize())
			.done(function(match) {
				addMatchButtonAndModal(match);
			});
	});

	$('#generateRoundRobinButton').click(function(e) {
		var id = $('#tournaments').val();
		$.get('api/generate/roundrobin', {id : id})
			.done(function(tourny) {
				populateMatches(id);
			});
	});

	$('#tournaments').change(function(e) {
		var id = $('#tournaments').val();
		populateMatches(id);
	});

	// Players Tab
	$('#playerModal_save').click(function(e) {
		$.post('/api/player', $('#playerForm').serialize(), function(response) {
			addPlayerToList(response);
		});
	});

	$.get('/api/player').done(function(players) {
		players.forEach(function(player) {
			addPlayerToList(player);
		});
	});
});

function addPlayerToList(player) {
	var button = $('<button></button>').addClass('list-group-item');
	button.prop('type', 'button').attr('data-toggle','modal');
	button.attr('data-target','#playerModal').text(player.name);
	button.prop('id', player._id);

	button.click(function(e) {
		// populate the form with this info
		$('#player-name').val(player.name);
		$('#email').val(player.email);
		$('#paid').prop('checked', player.paid);
		$('#playerModal_label').text(player.name);
		$('#playerModal_remove').prop('disabled', '');
	});

	$('#playerGroup').append(button);
}

// Functions

function showTeamModal(team) {
	$('#teamName').val(team.name);
	$('#tournament').val(team.tournament);
	$('#teammateGroup').empty();
	team.teammates.forEach(function(mate) {
		$('teammateGroup').append($('<li class="list-group-item"></li>').text(mate.name))
	});
}

function populateMatches(id) {
	$('matchTableBody').empty();
	$.get('/api/tournament', {id: id}).done(function(tourny) {
		// populate the matches
		console.log('from populateMatches');
		console.log(tourny);
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
		//$('#'+id+'_modal').remove();
	});
}

function addMatchTable(match) {
	var tableBody = $('#matchTableBody');

	var matchRow = $('<tr></tr>');
	var roundCol = $('<td></td>').text(match.round);
	var homeCol = $('<td></td>').text(match.home.name);
	var awayCol = $('<td></td>').text(match.away.name);
	var dateCol = $('<td></td>').text(match.date);
	var timeCol = $('<td></td>').text(match.time);

	matchRow.append(roundCol);
	matchRow.append(homeCol);
	matchRow.append(awayCol);
	matchRow.append(dateCol);
	matchRow.append(timeCol);

	tableBody.append(matchRow);
}

function addTeamButtonAndModal(team) {
	var button = $('<button></button>').addClass('list-group-item');
	button.prop('type', 'button').attr('data-toggle','modal');
	button.attr('data-target','#'+team._id+'_modal').text(team.name);
	button.prop('id', team._id+'_list');

	var modal = $('<div></div>').addClass('modal fade').prop('id', team._id+'_modal');
	modal.prop('tabindex', '-1').prop('role', 'dialog');

	var modalDialog = $('<div></div>').addClass('modal-dialog').prop('role','document');
	var modalContent = $('<div></div>').addClass('modal-content');
	var modalHeader = $('<div></div>').addClass('modal-header');

	var xButton = $('<button></button>').addClass('close').prop('type','button');
	xButton.prop('data-dismiss', 'modal').append($('<span></span>').prop('aria-hidden', 'true').text('&times;'));

	modalHeader.append(xButton);
	modalHeader.append($('<h4></h4>').addClass('modal-title').text('Editing ' + team.name));

	var modalBody = $('<div></div>').addClass('modal-body');

	var form = $('<form></form>').prop('id', team._id+"_form");
	var hiddenInput = $('<input type="hidden" name="id">').prop('value', team._id);

	form.append(hiddenInput);

	var formGroupName = $('<div></div>').addClass('form-group');
	formGroupName.append($('<label for="teamName">Team Name</label>'));
	formGroupName.append($('<input type="text" class="form-control" id="teamName" name="name">').prop('value', team.name));

	var formGroupMembers = $('<div></div>').addClass('form-group');
	formGroupMembers.append($('<label for="teammates">Members</label>'));
	formGroupMembers.append($('<p class="help-block">Enter the names of the members separated by newlines.</p>'));
	var textarea = $('<textarea rows="5" class="form-control" id="teammates" name="teammates"></textarea>');
	team.teammates.forEach(function(member) {
		textarea.append(member + '\n');
	});
	formGroupMembers.append(textarea);

	form.append(formGroupName);
	form.append(formGroupMembers);

	modalBody.append(form);

	var modalFooter = $('<div></div>').addClass('modal-footer');
	var closeButton = $('<button></button>').addClass('btn btn-default').prop('type','button').attr('data-dismiss', 'modal').text('Cancel');
	var saveButton = $('<button></button>').addClass('btn btn-primary').prop('type','button').prop('id', team._id+'_save').attr('data-dismiss','modal').text('Save');
	var deleteButton = $('<button></button>').addClass('btn btn-danger').prop('type','button').prop('id', team._id+'_remove').attr('data-dismiss', 'modal').text('Delete');

	saveButton.click(function(e) {
		saveTeam(team);
	});
	deleteButton.click(function(e) {
		deleteTeam(team);
	});

	modalFooter.append(closeButton);
	modalFooter.append(saveButton);
	modalFooter.append(deleteButton);

	modalContent.append(modalHeader);
	modalContent.append(modalBody);
	modalContent.append(modalFooter);

	modalDialog.append(modalContent);
	modal.append(modalDialog);

	$('#teamGroup').append(button);
	$('#teamGroup').append(modal);

	// add the matches
	$('#home').append($('<option></option>').text(team.name).prop('value', team._id));
	$('#away').append($('<option></option>').text(team.name).prop('value', team._id));
}