// nosql-lab-dataimport -- to cassandra :-)
"use strict";

var readPosts = require('./read-posts').readPosts;

var cassandra = require('cassandra-driver');
var async = require('async');

let queuedEntries = 0;
let processedEntries = 0;

// could use cassandra bulk loaded by converting xml into csv

var client = new cassandra.Client({
	contactPoints : [ '127.0.0.1' ],
	keyspace : 'nosqllab'
});

// Tests if table exists
client.execute('SELECT * FROM post', [], function(err, result) {

	if (err) {
		 console.log('execute failed', err.message);
		if(err.code==8704){
			console.log('Please setup tables before importing data. See lab instructions provided.');
			process.exit(0);
		}
	} else {

		let filePosts = __dirname + '/raw_xml/Posts.xml';
		console.log('Processing posts from "%s"', filePosts);
		readPosts(__dirname + '/raw_xml/Posts.xml', function *() {
		  let post = yield;
		  
		  while(post != null) {
			  
			  insertPost(post);
		    
	    	
		    
		    // get next entry
		    post = yield;
		  }

		});
	}
});

function insertPost(post){
	
	// postType 1 is for real questions (and not answers)
	
    var query = null;
    
    // Quotes with in the text can mess with insert. We have
	// seen this
	// in RDBMS as well.
    post.body = post.body.trim().replace(/'/g, '&#39;');
	var created = Date.parse(post.creationDate);
	var creationDate = post.creationDate.substring(0,10);
	var lastActivityDate = Date.parse(post.lastActivityDate);
	
	if(!post.lastEditor) post.lastEditor = 0;
	if(!post.owner) post.owner = 0;
	
	var displayName = null; 
	
	if(post.owner){

		query = "SELECT * FROM user WHERE id="+post.owner;
		client.execute(query, function(err, result){
//			errorHandler(err, "get user for " + post.owner, true);
			if(!err){
//				console.log(result.rows[0]);
				if(result.rows){
					displayName =  result.rows[0].displayname;
				}
				
//				console.log(" Got user " + displayName);
		    	
		    	if(post.title) post.title = post.title.replace(/'/g, '&#39;');
		    	
			    if(post.typeId==1){
			    	
			    	var one_hour = 3 * 60 * 60;
			    	var created_hash = created%one_hour;
			    	
				    query = "INSERT INTO post (id, title, body, created, score, lastActivityDate, commentCount, "
							+ " ownerUserId, ownerName, lastEditorUserId, creationDate, created_hash) "
				    	+"VALUES ("+post.id+", '"+ post.title +"', '"+ post.body +"', "+created+", "+post.score+", "+lastActivityDate+", "+post.commentCount
				    	+", "+post.owner+", '"+displayName+"', "+post.lastEditor+", '"+creationDate+"', '"+created_hash+"')";
				    
				     send_query(query);
			    } else {
			    	
			    	if(!post.parentId) post.parentId = 0;
			    	
			    	 query = "INSERT INTO response (id, body, created, score, parentId, ownerUserId, ownerName, lastEditorUserId) "
				    	+"VALUES ("+post.id+", '"+ post.body +"', "+created+", "+post.score+", "+post.parentId+", "+post.owner+ ", '"+displayName
				    	+"', "+post.lastEditor+")";
		    		 
		    		 send_query(query);
			    	
			    }
			}
		});
	}
}

function send_query(query){
	queuedEntries++;
	client.execute(query, [],
		function(err, result) {
			if (err) {
				console.log('execute failed', err);
				process.exit(0);
			} else {
				processedEntries++;
				 if((processedEntries % 1)==0) {
				     process.stdout.write('.');
				 }
				 
				 if(processedEntries>=queuedEntries){
					 console.log('\nWe are done');
					 process.exit(0);
				 }
			}
		}
	);
}

function errorHandler(err, operation, end) {
	if (err) {
		console.log(operation + ' failed', err);
		if(end) process.exit(0);
	} else {
		console.log(operation + ' succeeded.');
	}
}

