var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var teamSchema = new mongoose.Schema({
	name: String,
	wins: Number,
	losses: Number,
	tournament : {
		type: ObjectId,
		ref: 'Tournament'
	},
	teammates: [{
		type: ObjectId,
		ref: 'Member'
	}]
});

module.exports = mongoose.model('Team', teamSchema);