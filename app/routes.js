var Tournament = require('./model/tournament');
var Match = require('./model/match');
var Team = require('./model/team');
var Member = require('./model/member');
var Settings = require('./model/settings');
var helpers = require('./helpers');
var async = require('async');
var request = require('request');

module.exports = function(app) {

	app.get('/api/challonge/matches', function(req, res) {
		var options = {
			url: 'https://api.challonge.com/v1/tournaments/beachleague17/matches.json',
			qs: {
				api_key: '2gjxepsybgp5xb2bm2jaxyhjnsf6oxrnaf6zfdiu'
			}
		};

		request(options, function(err, response, body) {
			res.send(body);
		});
	});

	app.get('/api/challonge/teams', function(req, res) {
		var options = {
			url: 'https://api.challonge.com/v1/tournaments/beachleague17/participants.json',
			qs: {
				api_key: '2gjxepsybgp5xb2bm2jaxyhjnsf6oxrnaf6zfdiu'
			}
		};

		request(options, function(err, response, body) {
			res.send(body);
		});
	});
	
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
		});
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
		} else {
			Tournament.find({}, function(err, docs) {
				if (err) {
					res.send('Error finding tournaments.');
				} else {
					res.send(docs);
				}
			});
		}
	});

	app.get('/api/match', function(req, res) {
		var round = req.query.round;		
		var query = {};
		if (round) {
			query.round = round;
		}

		Match.find(query).sort({
			round: 1,
			time: 1
		}).populate('home away').exec(function(err, matches) {
			if (err) {
				res.send('Error finding the matches.');
				return;
			}

			res.send(matches);
		});

	});

	app.put('/api/match', function(req, res) {
		var tournament = req.body.tournament;
		var home = req.body.home;
		var away = req.body.away;
		var round = req.body.round;
		var date = req.body.date;
		var time = req.body.time;
		var game1 = req.body.game1;
		var game2 = req.body.game2;
		var game3 = req.body.game3;

		if (req.body.id == '' || req.body.id == undefined) {
			var newMatch = new Match();
			newMatch.round = round;
			newMatch.date = date;
			newMatch.time = time;
			newMatch.home = home;
			newMatch.away = away;
			newMatch.tournament = tournament;

			newMatch.populate('home', function(err) {
				newMatch.populate('away', function(err) {
					newMatch.save(function(err, updateMatch) {
						Tournament.findOne({_id: tournament}, function (err, tourny) {
							if (err) {
								console.log('Error updating the tournament.');
							} else {
								tourny.matches.push(updateMatch._id);
								tourny.save();
							}
						});

						var returnMatch = updateMatch.toObject();
						returnMatch.isNew = true;
						res.send(returnMatch);
					});
				});
			});
		} else {
			Match.findOne({_id: req.body.id}, function(err, match) {
				if (match.tournament) {
					if (!match.tournament.equals(tournament)) {
						console.log('Changing the tournament from the match isn\'t currently supported');
					}
				}

				if (round)
					match.round = round;
				if (tournament)
					match.tournament = tournament;
				if (time)
					match.time = time;
				if (home)
					match.home = home;
				if (away)
					match.away = away;
				if (date)
					match.date = date;
				if (game1)
					match.game1 = game1;
				if (game2)
					match.game2 = game2;
				if (game3)
					match.game3 = game3;

				match.save(function(err, updatedMatch) {
					updatedMatch.populate('home away game1 game2 game3', function(err, populatedMatch) {
						res.send(populatedMatch);
					});
				});
			});
		}
	});

	app.delete('/api/match', function(req, res) {
		Match.findOneAndRemove({_id: req.body.id}, function(err, match) {
			if (err) {
				res.send('Error removing the match.');
				return;
			} else {
				Tournament.find({}, function(err, tournaments) {
					tournaments.forEach(function(tournament) {
						var index = tournament.matches.indexOf(match._id);
						if (index > -1) {
							tournament.matches.splice(index, 1);
							tournament.save();
						}
					});
				});
				res.send(match);
			}
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
				newMember.paid = false;
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
		if (req.body.id == '' || req.body.id == undefined) {
			var newTeam = new Team();
			newTeam.name = req.body.name;
			newTeam.tournament = req.body.tournament;

			newTeam.save(function(err, team) {
				var returnTeam = team.toObject();
				returnTeam.isNew = true;
				helpers.addTeamToTournament(team, team.tournament);
				res.send(returnTeam);
			});
		} else {
			Team.findOne({_id: req.body.id}, function(err, doc) {
				if (err) {
					res.send('Error finding the team.');
				}

				if (doc) {
					doc.name = req.body.name;
					doc.tournament = req.body.tournament;
					doc.save(function(err, updatedTeam) {
						helpers.addTeamToTournament(doc, doc.tournament);
						updatedTeam.populate('teammates', function(err) {
							res.send(updatedTeam);
						});
					});
				}
			});
		}
	});

	app.get('/api/team', function(req, res) {
		Team.find().populate('teammates').exec(function(err, docs) {
			res.send(docs);
		});
	});

	app.delete('/api/team', function(req, res) {
		Team.findOneAndRemove({_id: req.body.id}, function(err, team) {
			if (err) {
				res.send('Error removing the team.');
			}

			Tournament.findOne({_id: team.tournament}, function(err, tourny) {
				var index = 0;
				if (err) {
					console.log('No tournament for the team');
				}
				if (team) {
					for (var i = 0; i < tourny.teams.length; i++) {
						if (tourny.teams[i].equals(team._id)) {
							index = i;
						}
						tourny.teams.splice(index, 1);
						tourny.save();
					}
				}
			});
			res.send(team);
		});
	});

	app.get('/api/player', function(req, res) {
		Member.find().exec(function(err, players) {
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
				helpers.addTeammate(member.team, member);
				res.send(member);
			}
		});
	});

	app.put('/api/player', function(req, res) {
		if (!req.body) {
			res.send('Error. No body found in request.');
			return;
		}

		if (req.body.id == '' || req.body.id == undefined) {
			var newPlayer = new Member();
			newPlayer.name = req.body.name;
			newPlayer.team = req.body.team;
			newPlayer.paid = req.body.paid;
			newPlayer.email = req.body.email;
			newPlayer.save(function(err, updatedPlayer) {
				if (err) {
					console.log(err);
					res.send('Error creating the player');
				} else {
					helpers.addTeammate(newPlayer.team, updatedPlayer);
					var returnPlayer = updatedPlayer.toObject();
					returnPlayer.isNew = true;
					res.send(returnPlayer);
				}
			});
		} else {
			Member.findOne({_id: req.body.id}, function(err, player) {
				if (err) {
					res.send('Error finding player');
					console.log(err);
					return;
				}

				if (player) {
					if (!player.team.equals(req.body.team)) {
						helpers.removeTeammate(player.team, player);
					}
					player.name = req.body.name;
					player.team = req.body.team;
					player.paid = req.body.paid;
					player.email = req.body.email;
					player.save(function(err, updatedPlayer) {
						helpers.addTeammate(player.team, updatedPlayer);
						res.send(updatedPlayer);
					});
				}
			});
		}
	});

	app.delete('/api/player', function(req, res) {
		console.log(req.body);

		Member.findOneAndRemove({_id: req.body.id}, function(err, member) {
			if (err) {
				res.send('Error finding and removing the player.');
			}

			Team.find({_id: member.team}, function(err, teams) {
				teams.forEach(function(team) {
					var index = team.teammates.indexOf(member._id);
					if (index > -1) {
						team.teammates.splice(index, 1);
						team.save();
					}
				});
				res.send(member);
			});
		});
	});

	app.get('/api/generate/roundrobin', function(req, res) {
		var id = req.query.id;

		Tournament.findOne({_id : id}, function(err, tourny) {
			if (err) {
				console.log('Error finding the specified tournament.');
			}
			
			// remove the previous matches
			Match.remove({_id : {$in : tourny.matches}}).exec();
			tourny.matches = [];

			helpers.generateRoundRobin(tourny, function(updatedTourny) {
				res.send(updatedTourny); // it may not have all the games in it yet
			});
		});
	});

	app.get('/api/settings', function(req, res) {
		Settings.findOne({}, function(err, settings) {
			if (err) {
				res.send('Error grabbing the settings');
			} else {
				res.send(settings);
			}
		});
	});

	app.put('/api/settings', function(req, res) {
		var tourny = req.body.currentTournament;
		if (tourny == '' || tourny == undefined) {
			tourny = null;
		}
		Settings.findOne({}, function(err, settings) {
			if (err) {
				res.send('Error saving the settings');
			} else if (settings) {
				settings.currentWeek = req.body.currentWeek;
				settings.currentTournament = tourny;
				settings.welcomeMessage = req.body.welcomeMessage;
				settings.save(function(err, updatedSettings) {
					if (err) {
						console.log(err);
					} else {
						res.send(updatedSettings);
					}
				});
			} else {
				var newSettings = new Settings();
				newSettings.currentWeek = req.body.settings;
				newSettings.currentTournament = tourny;
				newSettings.welcomeMessage = req.body.welcomeMessage;
				newSettings.save(function(err, savedSettings) {
					res.send(savedSettings);
				});
			}
		});
	});

	app.get('/api/calculate/stats', function(req, res) {
		Settings.findOne({}, function(err, settings) {
			if (err) {
				res.send('Error getting the settings.');
			} else {
				Tournament.findOne({_id: settings.currentTournament}).populate({
					path: 'matches',
					populate: {
						path: 'home away game1 game2 game3',
						options: {
							sort: {
								"round": 1,
								"time": -1
							}
						}
					}
				}).exec(function(err, tourny) {
					if (err) {
						res.send('Error finding tournament.');
					} else {
						// tally up the wins for every team
						Team.find({tournament: settings.currentTournament}, function(err, teams) {
							if (err) {
								res.send('Error getting the teams.');
							}

							teams.forEach(function(team) {
								team.wins = 0;
							});

							tourny.matches.forEach(function(match) {
								teams.forEach(function(team) {
									if (match.game1) {
										if (match.game1._id.equals(team._id)) {
											team.wins++;
										}
									}
									
									if (match.game2) {
										if (match.game2._id.equals(team._id)) {
											team.wins++;
										}
									}

									if (match.game3) {
										if (match.game3._id.equals(team._id)) {		
											team.wins++;
										}
									}
								});
							});

							var tasks = [];
							teams.forEach(function(team) {
								tasks.push(function(callback) {
									team.save(function(err, newTeam) {
										callback(err);
									});
								});
							});

							async.parallel(tasks, function(err) {
								res.send('done.');
							});

						});
					}
				});
			}
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
		Settings.findOne({}, function(err, settings) {
			res.render('index', {
				welcomeMessage: settings.welcomeMessage
			});
		});
	});

	app.get('/schedule', function(req, res) {
		Settings.findOne({}, function(err, settings) {
			Tournament.findOne({_id: settings.currentTournament}).populate({
				path: 'matches',
				populate: {
					path: 'home away game1 game2 game3',
					options: {
						sort: {
							"round": 1,
							"time": -1
						}
					}
				}
			}).exec(function(err, tourny) {
				if (tourny) {
					res.render('schedule', {
						matches: tourny.matches
					});
				} else {
					res.render('schedule', {
						matches: []
					});
				}
			});
		});
	});

	app.get('/stats', function(req, res) {
		Team.find({}).populate('teammates').exec(function(err, teams) { // all the teams for now
			Settings.findOne({}, function(err, settings) {
				Tournament.findOne({_id: settings.currentTournament}).populate({
					path: 'matches',
					populate: {
						path: 'home away game1 game2 game3',
						options: {
							sort: {
								"round": 1,
								"time": -1
							}
						}
					}
				}).exec(function(err, tourny) {
					if (tourny) {
						res.render('stats', {
							teams: teams,
							matches: tourny.matches
						});
					} else {
						res.render('schedule', {
							matches: [],
							teams: teams
						});
					}
				});
			});
		}); 
	});

	app.get('/rules', function(req, res) {
		res.render('rules');
	});
}