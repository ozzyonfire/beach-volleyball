var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var matchSchema = new mongoose.Schema({
	home: { 
		type: ObjectId,
		ref: 'Team'
	},
	away: {
		type: ObjectId,
		ref: 'Team'
	},
	winner: {
		type: ObjectId,
		ref: 'Team'
	},
	winningScore: Number,
	losingScore: Number,
	round: Number,
	date: Date,
	time: String
});

module.exports = mongoose.model('Match', matchSchema);