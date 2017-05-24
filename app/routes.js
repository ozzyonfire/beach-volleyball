var Tournament = require('./model/tournament');
var Match = require('./model/match');
var Team = require('./model/team');
var Member = require('./model/member');
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
				newTournament.matches = [];
				newTournament.teams = [];
				newTournament.save(function(err, tourny) {
					res.send(tourny);
				});
			}
		})
	});

	app.get('/api/tournament', function(req, res) {
		var id = req.body.id;
		var name = req.body.name;

		if (req.query) {
			id = req.query.id;
			name = req.query.name;	
		}

		if (id) {
			Tournament.findOne({_id: id}).populate({
				path : 'matches',
				populate : {
					path : 'home away'
				}
			}).exec(function(err, tourny) {
				if (err) {
					res.send('Error getting tournament: ' + err);
				}
				res.send(tourny);
			});	
		} else if (name) {
			Tournament.findOne({name: name}).populate('matches').exec(function(err, doc) {
				if (err) {
					res.send('Error getting the tournament.');
				}
				res.send(doc);
			});
		}
	});

	app.post('/api/match', function(req, res) {
		var tournament = req.body.tournament;
		var home = req.body.home;
		var away = req.body.away;
		var round = req.body.round;
		var date = req.body.date;
		var time = req.body.time;

		console.log(req.body);

		if (!tournament) {
			res.send('You must supply a tournament id to assign the match to.');
		}

		if (!home) {
			res.send('Please supply a home team id.');
		}

		if (!away) {
			res.send('Please supply an away team id.');
		}

		var newMatch = new Match();
		newMatch.round = round;
		newMatch.date = date;
		newMatch.time = time;
		newMatch.home = home;
		newMatch.away = away;

		newMatch.populate('home', function(err) {
			newMatch.populate('away', function(err) {
				newMatch.save(function(err, updateMatch) {
					Tournament.findOne({_id: tournament}, function (err, tourny) {
						if (err)
							res.send('Error finding the tournament.');

						tourny.matches.push(updateMatch._id);
						tourny.save();
						res.send(updateMatch);
					});
				});
			});
		});
	});

	app.post('/api/team', function(req, res) {
		var teammates = req.body.teammates;
		var tournament = req.body.tournament;

		if (teammates) {
			teammates = teammates.split('\n');
		} else {
			teammates = [];
		}

		var newTeam = new Team();
		newTeam.teammates = [];
		newTeam.name = req.body.name;
		newTeam.tournament = tournament;

		newTeam.save(function(err, team) {
			teammates.forEach(function(teammate) {
				var newMember = new Member();
				newMember.name = teammate;
				newMember.team = team._id;
				newMember.save(function(err, member) {
					team.teammates.push(member._id);
					team.save();
				});
			});

			Tournament.findOne({_id : tournament}, function(err, tourny) {
				tourny.teams.push(team);
				tourny.save();
				res.send(team);
			});
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

	app.get('/api/team', function(req, res) {
		Team.find().populate('teammates').exec(function(err, docs) {
			res.send(docs);
		});
	});

	app.delete('/api/team', function(req, res) {
		Team.findOneAndRemove({_id: req.body.id}, function(err, team) {
			if (err)
				res.send('Error removing the team.');

			Tournament.findOne({_id: team.tournament}, function(err, tourny) {
				var index = 0;
				for (var i = 0; i < tourny.teams.length; i++) {
					console.log(team._id + ' -> ' + tourny.teams[i]);
					if (tourny.teams[i].equals(team._id)) {
						console.log('found the team')
						index = i;
					}
				}

				console.log(index);

				tourny.teams.splice(index, 1);
				tourny.save(function(err, updatedTourny) {
					res.send(true);
				});
			});
		})
	});

	app.get('/api/player', function(req, res) {
		Member.find().populate('team').exec(function(err, players) {
			res.send(players);
		});
	});

	app.post('/api/player', function(req, res) {
		if (!req.body) {
			res.send('Error, no body found');
			return;
		}

		var newMember = new Member();
		newMember.name = req.body.name;
		newMember.email = req.body.email;
		newMember.paid = req.body.paid;
		newMember.team = req.body.team;

		newMember.save(function(err, member) {
			if (err) {
				res.send('Error saving player');
			} else {
				res.send(member);
			}
		});
	});

	app.get('/api/generate/roundrobin', function(req, res) {
		var id = req.query.id;

		Tournament.findOne({_id : id}, function(err, tourny) {
			if (err) {
				console.log('Error finding the specified tournament.');
			}
			
			// remove the previous matches
			match.remove({_id : {$in : tourny.matches}}).exec();
			tourny.matches = [];

			helpers.generateRoundRobin(tourny, function(updatedTourny) {
				res.send(updatedTourny); // it may not have all the games in it yet
			});
		});
	});

	app.get('/setup', function(req, res) {
		Team.find({}, function(err, docs) {
			if (err) {
				res.send('Error getting the teams.');
			}

			Tournament.find().populate({
				path: 'matches',
				populate: {
					path: 'home',
					select: 'name'
				}
			}).exec(function(err, tournys) {
				if (err) {
					res.send('Error getting the tournaments');
				}

				Member.find({}, function(err, players) {
					res.render('setup', {
						teams : docs,
						tournaments : tournys,
						players : players
					});
				});
			});
		});
	});

	app.get('/', function(req, res) {
		console.log('sending index');
		res.render('index');
	})
}