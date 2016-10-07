var app = require('express')();
var passer = require('./components/requestManager.js');
var liveStream = require('./components/live-stream.js');
var Stream = require('./components/stream.js');





/*------------------------------------------------------------------------------
  Configer Server
------------------------------------------------------------------------------*/
const PORT = 8080
  //Load HTTP protocal and start server
var server = require('http').Server(passer.server);
  //Pipe requests to PORT
server.listen(PORT,function(){console.log('Server listening at port '+PORT)});





/*------------------------------------------------------------------------------
  HTTP / XML requests
------------------------------------------------------------------------------*/

passer.publicFolder = "public";

passer.sessionFreeZones = ['/stream.mp3', '/stream/get/info', '/stream/metadata', '/stream/get/image', '/stream/listeners'];






/*------------------------------------------------------------------------------
  Setup LiveStream
------------------------------------------------------------------------------*/

var metaStream = new Stream();
metaStream.prevChunk = {};

var albumArt = new Buffer('');

liveStream.player.on('newSong', function(meta){
  albumArt = meta.picture[0];
  metaStream.write(meta);
  metaStream.prevChunk = meta;
});

passer.get('/stream.mp3', liveStream.pass);

passer.get('/stream/get/info', function(req, res){
  var data = {
    listeners: liveStream.listeners,
    song: liveStream.player.currentSongData
  };
  data.song.currentTime = (Date.now() - data.song.startTime)/1000;
  delete data.song.startTime;
  delete data.song.picture;
  res.end(JSON.stringify(data));
});

passer.get('/stream/metadata', function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chuncked'
  });

  var data  = metaStream.prevChunk;
  delete data.picture;

  res.write(JSON.stringify(data));

  var stream = metaStream.on('data', function(chunk){
    delete chunk.picture;
    res.write(JSON.stringify(chunk));
  });

  req.connection.on('close', function(){
    metaStream.remove('data', stream);
    return;
  });
});

passer.get('/stream/listeners', function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chuncked'
  });

  res.write(liveStream.listeners.num.toString());

  var stream = liveStream.listeners.on('data', function(chunk){
    res.write(chunk.toString());
  });

  req.connection.on('close', function(){
    liveStream.listeners.remove('data', stream);
    return;
  });
});

passer.get('/stream/get/image', function(req, res){
  var type = albumArt.type || 'jpg'

  res.writeHead(200, {
    'Content-Type': passer.documentTypes[type]
  });

  res.end(albumArt.data);
});
