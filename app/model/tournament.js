var mongoose = require('mongoose');

var tournamnetSchema = new mongoose.Schema({
	name: String,
	matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match'}],
	type: String
});

module.exports = mongoose.model('Tournament', tournamnetSchema);