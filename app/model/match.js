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
	game1: {
		type: ObjectId,
		ref: 'Team'
	},
	game2: {
		type: ObjectId,
		ref: 'Team'
	},
	game3: {
		type: ObjectId,
		ref: 'Team'
	},
	round: Number,
	date: Date,
	time: String,
	tournament: {
		type: ObjectId,
		ref: 'Tournament'
	}
});

module.exports = mongoose.model('Match', matchSchema);