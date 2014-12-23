var spotify = require('node-spotify')({ appkeyFile: 'spotify_appkey.key' });
var request = require('request')
var fs = require('fs')

var serverUrl = "http://queueup.louiswilliams.org";
var streamKey = fs.readFileSync('./streamKey.key', {encoding: 'utf8'}).trim();

var lastUpdate;
var currentTrack;
var queue;

// Gets the status of the playlist from the server
// Calls upon "update" to parse the JSON received
// Calls back with the update data for the response
function getStatus(callback) {
  var url = serverUrl + "/client/" + streamKey + "/stream";
  request(url, function(err, response, body) {
    if (!err) {
      var bodyJSON;
      try {
        bodyJSON = JSON.parse(body);
      } catch (e) {
        console.log("Problem: Response not valid JSON", e);
      }
      if (bodyJSON) {
        update(bodyJSON, callback);
      } else {
        callback();
      }
    } else {
      console.log("Request error: " + err.message);
      callback();
    }
  });
}

// Parses the JSON response from the server and makes changes to the 
// current play state and queue if necessary
// Calls back with the response data
function update(json, callback) {

  if (!json) {
    console.log("Json undefined...");
    return callback();
  }

  var response = {
    status: json.status,
    current: currentTrack,
    queue: queue
  };

  changePlayStatus(json.status);

  // If there is new information

  if (!lastUpdate || json.last_updated > lastUpdate.last_updated) {
    console.log("New info");
    console.log(json);

    var track = spotify.createFromLink(json.current);
    response.updated = true;

    // If the current song has changed or there was never a song playing
    if (!currentTrack || track.link != currentTrack.link) {
      currentTrack = track;
      response.current = track;
      if (track) {
        loadObj(track, function(t) {
        currentTrack = t;
          play(t);
          changePlayStatus(json.status);
        });
      } else {
        console.log("Bad spotify url: " + json.current);
      }
    }

   // RIght now, have to update queue. Way to check if queue changed in constant time?
   // Update queue
   lastUpdate = json;
  }

  var newQueue = [];
  createQueue(json.queue, newQueue, function(q) {
    queue = q;
    response.updated = true;
  });

  response.queue = queue;

  
  // Load album art
  if (currentTrack && currentTrack.album && !currentTrack.artwork) {
    loadObj(currentTrack.album, function(a) {
      currentTrack.artwork = a.getCoverBase64();
      response.current = currentTrack;
      response.updated = true;
    });
  }
  callback(response);
}

function start(callback){
  spotify.login('louieaw','0408dell', false,false);  
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

function changePlayStatus(status) {
  if (status == "play") {
    // If it was paused originally, resume
    spotify.player.resume();
  } else {
    console.log("Paused playback...");
    spotify.player.pause();
  }
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
  var url = serverUrl + "/client/" + streamKey + "/ended";
  request.post(url, function(err, response, body) {
    if (!err) {
      console.log("Ended track: ",body);
    } else {
      console.log("Error ending track",err);
    }
  });
}});



exports.getStatus = getStatus;
exports.start = start;

