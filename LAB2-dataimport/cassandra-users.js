// nosql-lab-dataimport -- to cassandra :-)
"use strict";

var readUsers = require('./read-users').readUsers;

var cassandra = require('cassandra-driver');
var async = require('async');

let queuedUsers = 0;
let processedUsers = 0;

// could use cassandra bulk loaded by converting xml into csv

var client = new cassandra.Client({
	contactPoints : [ '127.0.0.1' ],
	keyspace : 'nosqllab'
});

// Tests if table exists
client.execute('SELECT * FROM user', [],

function(err, result) {

	if (err) {
		 console.log('execute failed', err.message);
		if(err.code==8704){
			console.log('Fixing workspace.');
			client.execute("CREATE TABLE user(id int, reputation int, created timestamp, displayName text, "
					+ " accountId int, PRIMARY KEY(id))", function(err){
				errorHandler(err, "create user table", true);
				
				let fileUsers = __dirname + '/raw_xml/Users.xml';
				console.log('Processing users from "%s"', fileUsers);
				readUsers(__dirname + '/raw_xml/Users.xml', function *() {
				  let user = yield;
				  
				  while(user != null) {
				    
				    // Quotes with in the text can mess with insert. We have seen this
					// in RDBMS as well.
			    	var created = Date.parse(user.creationDate);
			    	var creationDate = user.creationDate.substring(0,10);
			    	
			    	
			    	if(user.displayName) user.displayName = user.displayName.replace(/'/g, '&#39;');
			    	
			    	// CREATE TABLE user(id int, reputation int, created timestamp, displayName text,  accountId int
				    var query = "INSERT INTO user (id, reputation, displayName, created, accountId) "
				    	+"VALUES ("+user.userId+", "+ user.reputation +", '"+ user.displayName +"', "+created+", "+user.accountId+")";
				    
				    send_query(query);
				    
				    // get next entry
				    user = yield;
				  }
				});
			});
		} else{
			console.log('User table may already exist. Drop table and try again.');
			 process.exit(0);
		} 
			
	} else{
		console.log('User table already exists.');
		 process.exit(0);
	} 
});

function send_query(query){
	queuedUsers++;
	client.execute(query, [],
		function(err, result) {
	
			if (err) {
				console.log('execute failed', err);
				process.exit(0);
			} else {
				processedUsers++;
				 if((processedUsers % 100)==0) {
				     process.stdout.write('.');
				 }
				 
				 if(processedUsers>=queuedUsers){
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

function setupWorkspace() {
	var client = new cassandra.Client({
		contactPoints : [ '127.0.0.1' ]
	});
	client .connect(function(err) {
		if (!err) {
			client.execute("USE nosqllab", [], function(err){
				errorHandler(err, "use nosqllab", true);
				client.execute("CREATE TABLE user(id int, reputation int, created timestamp, displayName text, "
						+ " accountId int, PRIMARY KEY(id))", function(err){
					errorHandler(err, "create user table", true);
					process.exit(0);
				});
			});
			
		} else {
			errorHandler(err, "Connect: ");
		}
	});
	client.shutdown(function(err) { // do nothing
	});
}
