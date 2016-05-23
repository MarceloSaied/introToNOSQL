// nosql-lab-cassandra
"use strict";

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cassandra = require('cassandra-driver');
var async = require('async');

// let's get it started:
var app = express(); // init express
app.use(logger('dev')); // URL logging

// view engine to save us from painful html typing
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.static(path.join(__dirname, 'static')));

var client = new cassandra.Client({
	contactPoints : [ '127.0.0.1' ],
	keyspace : 'nosqllab'
});


/*
 * Here on "/" we simply want to LIST all blog entries we have...
 */
app.get('/', function(req, res) {
	client.execute('SELECT id, title, created, commentCount FROM post LIMIT 100', [],

	function(err, result) {

		if (err) {
			console.log('execute failed', err.message);
			res.status(500).send(err.message);
		} else {
			console.log('KEYS returned %j', result.rows);
			res.render('index', {
				keys : result.rows
			});

		}
	});
});

/*
 * Here we really want to access a specific blog-post
 */
app.get('/post/:postId', function(req, res) {
	var postId = req.params.postId;
	console.warn('getting post "%s" ', postId);
//	res.status(501).send('some homework to do...');
	
	var post = null;
	var comments = null;
	
	client.execute('SELECT * FROM post WHERE id='+postId, [],

		function(err, result) {

			if (err) {
				console.log('execute failed', err.message);
				res.status(500).send(err.message);
			} else {
				console.log('Post returned %j', result.rows);
				
				post = result.rows;
				

				
				client.execute('SELECT * FROM response WHERE parentId='+postId, [],

						function(err, com) {
//					console.log(post);
					if (err) {
						console.log('execute failed', err.message);
						res.status(500).send(err.message);
					} else {
						console.log('COMMENTS returned %j', com.rows);
						
						console.log("Sending back from comments ");
						res.render('details', {
							post: post,
							comments : com.rows
						});

					}
				});
				
				/*var sent = false;
				while(!sent){
					if(comments){
						console.logger("Comments are here......");
						
					} else {
						console.logger("Waiting for comments");
					}
				}*/
			}
		});
	
});


// Let's boot up the server :-)
var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});

module.exports = app;
