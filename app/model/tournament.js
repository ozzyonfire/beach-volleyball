var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId
var tournamentSchema = new mongoose.Schema({
	name: String,
	matches: [{ type: ObjectId, ref: 'Match'}],
	teams: [{ type: ObjectId, ref: 'Team' }],
	type: String
});

module.exports = mongoose.model('Tournament', tournamentSchema);