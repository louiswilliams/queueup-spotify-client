var spotify = require('node-spotify')({ appkeyFile: 'spotify_appkey.key' });
var request = require('request')
var io = require('socket.io-client');
var fs = require('fs')
var loudness = require('loudness');

var lastUpdate;
var currentTrack;
var queue;

var streamKey = fs.readFileSync('./streamKey.key', {encoding: 'utf8'}).trim();
var username = fs.readFileSync('./user.key', {encoding: 'utf8'}).trim();
var password = fs.readFileSync('./pass.key', {encoding: 'utf8'}).trim();
var serverUrl = "http://queueup.louiswilliams.org";

var auth_success = false;
var client = io.connect(serverUrl, {
  "force new connection": true
});
/*
  Handle socket authentication with the server.
*/
client.on('auth_request', function(data){
  console.log("Received auth request...");

  /* Send auth key */
  client.emit('auth_send', {key: streamKey});
});

/* Auth successful */
client.on('auth_success', function() {
  console.log("Authentication success");
  /* Listen for updates from the server */
  var auth_success = true;
  // clientListen(client);
});

/* Unsuccessful auth */
client.on('auth_fail', function(err) {
  console.log("Authentication failure: ", err);
})

/* Handle the server disconnecting */
client.on('disconnect', function() {
  console.log("Server disconnected...");
});

/* Handles a new play state sent to the client */
client.on('state_change', function (state) {
    console.log("Received new state from server: ", state);  
    updateVolume(state.volume);
    if (state.track) {
      updateTrack(state.track.uri, function() {
        /* The play state needs to be changed AFTER a new song is added */
        updatePlaying(state.play);
      });
    }
});

/* 
  Changes the play state. Accepts a boolean value that describes
  if the player is playing or not
*/
function updatePlaying(play) {
  if (play) {
    /* If it was paused originally, resume */
    spotify.player.resume();
  } else {
    console.log("Paused playback...");
    spotify.player.pause();
  }
}

/*
  Changes the volume (loudness). Accepts an integer from 0 to 100.
*/
function updateVolume(volume) {
  var vol_adj = 10 * Math.sqrt(Math.min(Math.abs(volume)), 100);
  console.log("Loudness altered by ", volume - vol_adj);
  loudness.setVolume(vol_adj, function(err) {
    /* Because this library increases volume linearly,
       project it to a logarithmic curve
    */ 
    if (err) {
      console.log("Error setting the volume to " + vol_adj);
    } else {
      loudness.getVolume(function(err, vol) {
        console.log("Volume set to " + vol);     
      })
    }
  });
}

/* 
  Changes the track if the passed url is different or nothing is playing
*/
function updateTrack(track_uri, callback) {

  var track = spotify.createFromLink(track_uri);

  // If the current song has changed or there was never a song playing
  if (!currentTrack || track.link != currentTrack.link) {
    // currentTrack = track;
    if (track) {
      loadObj(track, function(t) {
        currentTrack = t;
        play(t);
        callback();
      });
    } else {
      console.log("Bad spotify url: " + json.current);
      callback();
    }
  } else {
    callback();
  }

}


function start(callback){
  spotify.login(username, password, false,false);  
  spotify.on({
    ready: function() {
      console.log("Spotify ready...");
      callback();
    }
  });
}

// Helper function to play a song
function play(track) {
  console.log("Now Playing " + track.name + " by " + track.artists[0].name);
  spotify.player.play(track);  
}

// Loads the track and calls back when ready
// Assumes obj is defined
function loadObj(obj, callback) {
    if (obj.isLoaded) {
      callback(obj);
    } else {
      spotify.waitForLoaded([obj], function(o) {
        callback(o);
      });
    }
}

// Using recursion to load every song in the queue?
function createQueue(jsonQueue, queue, callback) {
  if (jsonQueue.length == 0) {
    return callback(queue);
  }
  var track = spotify.createFromLink(jsonQueue[0].track);
  console.log(jsonQueue.length);
  loadObj(track, function(t) {
    queue.push({
      name: t.name,
      album: t.album.name,
      artist: t.artists[0].name
    });
    createQueue(jsonQueue.splice(1,jsonQueue.length - 1), queue, callback);
  });
}

var functions = [];

processor(function(data, next) {
  // Perform some action on data
  next(data);
});

function processor(fn) {
  functions.push(fn);
}

function process(fns) {
  if (fns.length > 0) {
    var i = 0;
    for (i; i < fns.length - 1; i++) {
      fns[i](req, res, fns[i + 1]);
    }
    fns[i] = function() {};
  }
}

// POST to the server to let it know the track has finished
spotify.player.on({endOfTrack: function() {
  client.emit('track_finished');
}});


// exports.getStatus = getStatus;
exports.start = start;

