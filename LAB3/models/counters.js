var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var countersSchema = Schema({	
	_id: {
		type: String,
		required: true
	},	
	sequence: {
		type: Number,
		required: true
	}
})

module.exports = mongoose.model('counters', countersSchema);