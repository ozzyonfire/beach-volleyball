var Team = require('./model/team');
var Match = require('./model/match');

function newMatch(round, home, away, tournament) {

	console.log('round: ' + round + ' - ' + home + ' vs. ' + away);
	var newMatch = new Match();
	newMatch.home = home;
	newMatch.away = away;
	newMatch.round = round;

	return newMatch;
	// newMatch.save(function(err, match) {
	// 	console.log('new match round: ' + match.round);
	// 	tournament.matches.push(match._id);
	// 	tournament.save();
	// });
}

function rotateTeams(teams) {
	var tempTeams = [];

	// keep position one fixed (I don't think it matters which position)
	tempTeams.push(teams[0]);

	// the second position is the team that just played team 1
	tempTeams.push(teams[(teams.length/2)]);

	for (var i=1; i < (teams.length/2) - 1; i++) { // start at i = 1, because the first position doesn't move
		tempTeams.push(teams[i]);
	}

	for (var i=(teams.length/2)+1; i < teams.length; i++) {
		tempTeams.push(teams[i]);
	}

	// finally the last position is the middle team
	tempTeams.push(teams[(teams.length/2)-1]);

	return tempTeams;
}

function makeBracket(tournament, callback) {
	var teams = tournament.teams;
	var numberOfGamesPerRound = (teams.length / 2)
	var numberOfRounds = teams.length - 1;		

	var matches = [];	

	for (var r = 0; r < numberOfRounds; r++) {
		var homeTeams = [];
		var awayTeams = [];

		console.log('Round ' + (r+1));

		// determine the home teams
		for (var i = 0; i < teams.length / 2; i++) {
			homeTeams.push(teams[i]);
		}
		// determine the away teams
		for (var i = teams.length / 2; i < teams.length; i++) {
			awayTeams.push(teams[i]);
		}

		// now assign home vs away for each index
		for (var i=0; i < homeTeams.length; i++) {
			matches.push(newMatch(r + 1, homeTeams[i], awayTeams[i], tournament));
		}

		// at the end of the round rotate the teams in the array
		teams = rotateTeams(teams);
	}
	
	Match.collection.insert(matches, function(err, docs) {
		if (err) {
			console.log(err);
			callback(tournament);
		}

		tournament.matches = docs.insertedIds;
		tournament.save(function(err, newTourny) {
			callback(tournament);
		});
	});

}

module.exports = {
	createTeam : function(name) {
		var newTeam = new Team();
		newTeam.name = name;
		newTeam.save();
		return newTeam;
	},
	generateRoundRobin : function(tournament, callback) {
		var teams = tournament.teams;

		console.log(teams);

		if (teams.length % 2 == 1) { // odd number of teams
			// if there are an odd number of teams, we need to add a Ghost team
			// if a team plays a Ghost, they get a bye
			var ghostTeam = new Team();
			ghostTeam.name = 'Ghost';
			ghostTeam.save(function (err, ghost) {
				tournament.teams.push(ghost._id);
				tournament.save(function (err, tourny) {
					makeBracket(tourny, callback);
				});
			});
		} else {
			makeBracket(tournament, callback);
		}
	}
}