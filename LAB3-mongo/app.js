var express = require('express');
var path = require('path');
var logger = require('morgan');
var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jade = require('jade');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Schema/Model for the posts collection
var Post = require('./models/posts');

/* Schema/Model for the counters collection. This is used to maintain the 
   current sequence of  _id field in posts collection - Used for new posts */
var Counters = require('./models/counters');


/* GET home page. */

app.get('/', function(req, res, next) {
  res.render('index', { });
  res.end();
});


/* Save New Posts.    */

app.post('/new', function(req, res, next) {

    // Establish a connection to mongoDB   
    var db = mongoose.connect('mongodb://localhost:27017/nosqllab');   
    
    /* Reads the current sequnce number from counters collection to use as the unique _id and 
       increments it by 1*/     
    var query = {_id: "posts"};      
    var update = {$inc: {sequence: 1}};
    var options = {upsert: true};
    Counters.findOneAndUpdate( query, update, options, function(err, counter) {
        if (err) { 
          console.log("Error - " + err);
        } else {  
          // Use the sequence and save the post           
          var newPost = new Post({     
             _id: counter.sequence, 
             title: req.body.title,
//           owner: "Student"             
             body: req.body.post_body
          });               
          
          newPost.save(function(err) {
           
             if (err) {
               console.log(err);
               res.end("Error in query" + err);
             } else {
               db.disconnect();
               res.redirect('/posts');         
             }                                
          });                                    
        }         
     });    
});


/* GET New Post page. */

app.get('/new', function(req, res) {
  res.render('new', { title: 'New Posts' });
  res.end();
});


/* GET Response page. */

app.get('/response/:postId', function(req, res) {
  res.render('response', { postId: req.params.postId });
  res.end();
});



/* GET Comments page. */

app.get('/comment/:postId', function(req, res) {
  res.render('comment', { postId: req.params.postId });
  res.end();
});



/* List all posts. */

app.get('/posts', function(req, res) {

   var db = mongoose.connect('mongodb://localhost:27017/nosqllab');  
  
    var query = {};    
    var fields = {};  
    var options = {};

    // List the last 100 posts (sort by descending _id (running number) and limit to 100) 
    Post.find( query, fields, options).sort({_id: -1}).limit(50).exec(function(err, posts) {             
          res.render("posts", { posts: posts });
          res.end();      
          db.disconnect();
      });  
  });
  


/* Display the selected post */

app.get('/posts/:postId', function(req, res) {

    var db = mongoose.connect('mongodb://localhost:27017/nosqllab');
           
    // Read the selected post id from MongoDB       
    var query = {_id: parseInt(req.params.postId.trim())};   
    var fields = {};  
    var options = {};     
    Post.findOne(query, function(err, post) {  
 
       if (err) { console.log("Error - " + err)}
       res.render('post', {
            post: post
       });
       res.end();            
       db.disconnect();
     });  
 });



/* Display the post in JSON format */
  
 app.get('/jsonpost/:postId', function(req, res) {

    var db = mongoose.connect('mongodb://localhost:27017/nosqllab');

   // Read the selected post from mongoDB
    var query = {_id: parseInt(req.params.postId.trim())};   
    var fields = {};  
    var options = {};     
    Post.findOne(query, function(err, post) {  
 
       if (err) { console.log("Error - " + err)}
       res.render('jsonpost', {
              post: JSON.stringify(post)
       });
       res.end();            
       db.disconnect();
     });  
 });
 
 
/* Save the response as an embedded document to the post */
 
 app.post('/response/:postId', function(req, res, next) {
   
    var db = mongoose.connect('mongodb://localhost:27017/nosqllab');    

    // update the post - add the response to the responses array
    var query = {_id: req.params.postId};       
    var update = {$push: {"responses": {"body": req.body.resp_body}}};
    var options = {upsert: true};
    Post.findByIdAndUpdate( query, update, options, function(err, data) {
        if (err) { 
          console.log("Error - " + err);
        } else {  
            db.disconnect();
            res.redirect('/posts');
         }                                                   
    });  
 
 });
 

 
/* Save the comment as an embedded document to the post */
  
 app.post('/comment/:postId', function(req, res, next) {

 });     


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
