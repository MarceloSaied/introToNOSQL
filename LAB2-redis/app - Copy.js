// nosql-lab-redis
"use strict";

var express = require('express');
var path    = require('path');
var logger  = require('morgan');
var Redis   = require('ioredis');

// let's get it started:
var app = express();      // init express
app.use(logger('dev'));   // URL logging

// view engine to save us from painful html typing
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.static(path.join(__dirname, 'static')));

/* We're using ioredis, the currently recommended fast client
 * check https://github.com/luin/ioredis for details
 */
var redis = new Redis(6379, "127.0.0.1", {
  showFriendlyErrorStack: true,
  retryStrategy: function (times) {
    if(times <= 5) {
      console.warn('Redis: no connection, retry #%d of 5', times);
    }
    console.error('Redis: no connection, giving up');
    return 500;
  }
});

/*
 * Here on "/" we simply want to LIST all blog entries 
 * we have...
 */
app.get('/', function (req, res) {
    // get KEYS with *.meta only
  redis.keys('*.meta').then(function (result) {  
    // this gives us an array of key NAMES
    console.log('KEYS returned %j', result);
    res.render('index', { keys: result });
  }).catch(function (err) {
    console.log('KEYS went wrong...', err);
    res.status(500).send(err.message);
  });
});

/*
 * Here we really want to access a specific blog-post
y want to access a specific blog-post
 */
app.get('/post/:postId', function (req, res) {
  
  var ResultPostId = '';
  var ResultBodyId = {};
  
  
  
  let postId = req.params.postId;
  let postBody = postId.replace("meta", "body");  // replace meta with body to find the body KEY

  
	//get the "meta" key data
  redis.get(postId, function(err, result) {
		if(err) {
			console.warn('Couldn\'t get "%s" ', postId, err);
			res.status(501).send('Couldn\'t retrieve element ' + err);
			return;
		}else{
    ResultPostId = result;
  }
	});

  
	//get the "body" key data
	redis.get(postBody, function(err, ResultBodyId) {
		if(err) {
			console.warn('Couldn\'t get "%s"', postId, err);
			res.status(501).send('Couldn\'t retrieve element ' + err);
			return;
		}else{ResultBodyId = result;}
	});	

 	if(ResultPostId) {
		let parsed_content = JSON.parse(ResultPostId);
		res.render('post', {
			postId: postId,
			//metaId : postMeta ,
			content: parsed_content,
			raw_content : ResultPostId
		});
	} else {
		// not found as ResultPostId = null
		res.status(404).send('Post ' + postId + ' not found' + ResultPostId);
	}
 
 

    
});

redis.on('ready', function (err, redisclient) {
  // Let's boot up the server :-)
  var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
  
    console.log('Example app listening at http://%s:%s', host, port);
  });
});

module.exports = app;
