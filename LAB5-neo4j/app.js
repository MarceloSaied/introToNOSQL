// nosql-lab-redis
"use strict";

var express = require('express');
var path    = require('path');
var logger  = require('morgan');
var neo     = require('seraph')({
  user: 'neo4j',
  pass: 'nosqllab'
});

// let's get it started:
var app = express();      // init express
app.use(logger('dev'));   // URL logging

// view engine to save us from painful html typing
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.static(path.join(__dirname, 'static')));

/*
 * Here on "/" we simply want to LIST some entries 
 * we have...
 * 
 * Cypher: MATCH (n:post) RETURN n LIMIT 100
 */
app.get('/', function (req, res) {
  let cypher = "MATCH (n:post) "
             + "RETURN n "
             + "ORDER BY n.creationDate DESC "
             + "LIMIT {limit} ";
  
  neo.query(cypher, {limit: 100}, function(err, result) {
    if (err) {
      console.log(err);
      res.status(500).send(err);  
      return;
    }
    
    res.render('index', { keys: result });
  });
});

/*
 * Here we really want to access a specific blog-post,
 * and get the post as well as the response or comment (respcomm)
 */
app.get('/post/:postId', function (req, res) {
  let postId = parseInt(req.params.postId);
  
  let cypher = "MATCH (post:post)<-[:responds_to*0..1]-(respcomm) "
             + "WHERE post.postId = {id} "
             + "RETURN post, respcomm ";
             
  neo.query(cypher, {id: postId}, function(err, result) {
    if (err) {
      console.log(err);
      res.status(500).send(err);  
      return;
    }
    console.log('Got for %d: ', postId, result);
    // there is the special case where the question was NOT 
    // answered at all, then post == respcomm
    if(result.length === 1 && result[0].post.postId === result[0].respcomm.postId) {
      console.log('Got an unanswered question');
      result[0].respcomm = null;
    }
    
    res.render('post', {vals: result, postId: postId});
  });
});

// Let's boot up the server :-)
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

module.exports = app;
