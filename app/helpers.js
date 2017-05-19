var Team = require('./model/team');

module.exports = {
	createTeam : function(name) {
		var newTeam = new Team();
		newTeam.name = name;
		newTeam.save();
		return newTeam;
	}
}