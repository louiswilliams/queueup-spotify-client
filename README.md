Node Spotify Server
===================

This server connects to a master server and plays music, changes volume, and plays/pauses as the master server changes stat or makes requests.

The idea is that anybody can connect to the master server (not this) and change the current settings, which immediately reflect on this server, which uses LibSpotify to stream music.

Install
-------
- Download and install [libspotify](https://developer.spotify.com/technologies/libspotify/)
- Install alsasound: `libasound2-dev`
- Download `spotify_appkey.key` from https://devaccount.spotify.com/my-account/keys/
- Create `streamKey.key` with the ID from queueup.louiswilliams.org/playlist/:id
- Create `user.key` with your username
- Create `pass.key` with your password
- `npm install`

Run
---
- `nodejs app.js`
