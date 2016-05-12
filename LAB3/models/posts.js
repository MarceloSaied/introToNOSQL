var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = Schema({	
	_id: {
		type: Number,
		required: true,
		trim: true
	},	
	title: {
		type: String,
		required: true,
		trim: true
	},
	creationDate: {
		type: Date,
		default: Date,
		required: false
	},
	body: {
		type: String,
		required: false,
		trim: true
	},
	responses: [
			{
				_id: false,
				required: false,
				body: {
			    type: String,
		      required: false,
				  trim: true		
				}, 					
				creationDate: {
		      type: Date,
					default: Date,
		      required: false
	      },
	      owner: {
		      type: String,
		      required: false
	      }					
			}
		],
	comments: [
			{
				_id: false,
				required: false,
				text: {
			    type: String,
		      required: false,
				  trim: true		
				}, 						
				creationDate: {
		      type: Date,
					default: Date,
		      required: false		
				} 		
			}
		] ,		
	owner: {
		type: String,
		required: false,
		default: "Student"
	}			
})

module.exports = mongoose.model('posts', postSchema);