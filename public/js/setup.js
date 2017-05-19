$(document).ready(function() {

	// buttons
	$('#addTeamButton').click(function(e) {
		$.post('/api/team', $('#teamForm').serialize())
			.done(function(team) {
				console.log(team);
				addTeamButtonAndModal(team);
			});
	});

	$('#addTournamentButton').click(function(e) {
		$.post('/api/tournament', $('#tournamentForm').serialize())
			.done(function(tourny) {
				console.log(tourny);
				// necessary updates
			})
	})

	$.get('/api/team').done(function(teams) {
		console.log(teams);
		teams.forEach(function(team) {
			var id = team._id;
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
});

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
}