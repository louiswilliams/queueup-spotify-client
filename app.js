var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var spotify = require('./spotify.js');

var app = express();
var http = require('http');
var server = http.Server(app);
var router = express.Router();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(router);
app.use(express.static(__dirname + '/public'));

// Error handling
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, "Internal server error :( " + e.message);
  next();
});


// Routing

router.get('/', function(req, res) {
  res.render('index', { title : 'Home'});
});

// router.get('/status', function(req, res) {
//   spotify.getStatus(function(data) {
//     if (!data) {
//       res.status(404).end();
//     } else {
//       res.json(data);
//     }
//   });

// });

// Start Spotify
spotify.start(function() {
  console.log("Started spotify...");
  // Start local server
  server.listen(3000, function() {
    console.log("Server started. Listening on port %d", server.address().port);
  });
});