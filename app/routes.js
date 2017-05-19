var Tournament = require('./model/tournament');
var Match = require('./model/match');
var Team = require('./model/team');
var helpers = require('./helpers');

module.exports = function(app) {
	
	app.post('/api/tournament', function (req, res) {
		if (!req.body) {
			res.send('Error.');
		}

		Tournament.findOne({name: req.body.name}, function(err, doc) {
			if (err) {
				res.send('Error creating the tournament.');
			}

			if (doc) {
				res.send(doc);
			} else {
				var newTournament = new Tournament();
				newTournament.name = req.body.name;
				newTournament.type = req.body.type;
				newTournament.save();
				res.send(newTournament);
			}
		})
	});

	app.get('/api/tournament', function(req, res) {
		Tournament.findOne({name: req.query.name}, function(err, doc) {
			if (err) {
				res.send('Error getting the tournament.');
			}
			res.send(doc);
		});
	});

	app.post('/api/match', function(req, res) {
		var tournamentName = req.body.tournamentName;
		var home = req.body.home;
		var away = req.body.away;
		var round = req.body.round;
		var datetime = req.body.datetime;

		if (!tournamentName) {
			res.send('You must supply a tournament name to assign the match to.');
		}

		if (!home) {
			res.send('Please supply a home team.');
		}

		if (!away) {
			res.send('Please supply an away team.');
		}

		var newMatch = new Match();
		newMatch.round = round;
		newMatch.datetime = datetime;

		Team.findOne({name: home}, function(err, homeTeam) {
			if (!homeTeam) {
				homeTeam = helpers.createTeam(home);
			}

			newMatch.home = homeTeam._id;

			Team.findOne({name: away}, function(err, awayTeam) {
				if (!awayTeam) {
					awayTeam = helpers.createTeam(away);
				}

				newMatch.away = awayTeam._id;

				newMatch.save(function(err, updateMatch) {
					Tournament.findOne({name: tournamentName}, function (err, tourny) {
						tourny.matches.push(updateMatch._id);
						res.send(updateMatch);
					});
				});
			});
		});
	});

	app.post('/api/team', function(req, res) {
		var teammates = req.body.teammates;

		if (teammates) {
			teammates = teammates.split('\n');
		} else {
			teammates = [];
		}

		var newTeam = new Team();
		newTeam.teammates = teammates;
		newTeam.name = req.body.name;

		newTeam.save(function(err, team) {
			res.send(team);
		});
	});

	app.put('/api/team', function(req, res) {
		Team.findOne({_id: req.body.id}, function(err, doc) {
			if (err) {
				res.send('Error saving the team.');
			}

			if (doc) {
				doc.name = req.body.name;
				doc.teammates = req.body.teammates.split('\n');
				doc.save(function(err, updatedTeam) {
					res.send(updatedTeam);
				})
			}
		})
	});

	app.put('/api/team/member', function(req, res) {
		var name = req.body.name
		if (!name) {
			res.send('Error. Please supply a team name.');
		}

		Team.findOne({name: name}, function(err, doc) {
			doc.teammates.push(req.body.member);
			doc.save(function(err, updatedTeam) {
				res.send(updatedTeam);
			});
		});

	});

	app.get('/api/team', function(req, res) {
		Team.find({}, function(err, docs) {
			res.send(docs);
		});
	});

	app.delete('/api/team', function(req, res) {
		Team.remove({_id: req.body.id}, function(err) {
			if (err)
				res.send(false);
			res.send(true);
		})
	});

	app.get('/setup', function(req, res) {
		Team.find({}, function(err, docs) {
			if (err) {
				res.send('Error getting the teams.');
			}

			Tournament.find({}, function(err, tournys) {
				if (err) {
					res.send('Error getting the tournaments');
				}

				res.render('setup', {
					teams : docs,
					tournaments : tournys
				});
			});
		});
	});

	app.get('/', function(req, res) {
		console.log('sending index');
		res.render('index');
	})
}