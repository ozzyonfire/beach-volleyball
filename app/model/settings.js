var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var settingsSchema = new mongoose.Schema({
	currentWeek: Number,
	currentTournament: {
		type: ObjectId,
		ref: 'Tournament'
	},
	challongeTournament: String,
	welcomeMessage: String
});

module.exports = mongoose.model('Settings', settingsSchema);