// nosql-lab-redis
"use strict";

var express = require('express');
var path = require('path');
var logger = require('morgan');
var Redis = require('ioredis');

// let's get it started:
var app = express(); // init express
app.use(logger('dev')); // URL logging

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
        if (times <= 5) {
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
        res.render('index', {
            keys: result
        });
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
    let postMeta = req.params.postId;
    let postBody = postMeta.replace("meta", "body");//replace meta with body to find the body KEY

    redis.multi([
        ["get", postMeta], //get the "meta" key data
        ["get", postBody]  //get the "body" key data
        ]).exec(function (err, result) {
        if (err) {
            console.warn('Couldn\'t get "%s" ', postMeta, err);
            res.status(501).send('Couldn\'t retrieve element ' + err);
            return;
        } else {
            var tmp = result[0];
            var ResultPostId = tmp[1];
            //console.log(ResultPostId);

            var tmp = result[1];
            var ResultBodyId = tmp[1];
            //console.log(ResultBodyId);

            if (ResultPostId && ResultBodyId) {
                let parsed_contentMeta = JSON.parse(ResultPostId);
                let parsed_contentBody = ResultBodyId;
                res.render('post', {
                    postId: postMeta,
                    contentBody: parsed_contentBody,
                    contentMeta: parsed_contentMeta,
                    raw_contentMeta: ResultPostId,
                    raw_contentBody: ResultBodyId
                });
            } else {
                // not found as ResultPostId = null
                res.status(404).send('Post ' + postMeta + ' not found' + ResultPostId);
            }
        }
    });
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