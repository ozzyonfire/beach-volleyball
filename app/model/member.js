var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var memberSchema = new mongoose.Schema({
	name: String,
	team: {
		type: ObjectId,
		ref: 'Team'
	},
	email: String,
	paid: Boolean
});

module.exports = mongoose.model('Member', memberSchema);