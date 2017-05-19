var mongoose = require('mongoose');

var teamSchema = new mongoose.Schema({
	name: String,
	wins: Number,
	losses: Number,
	teammates: [String]
});

module.exports = mongoose.model('Team', teamSchema);