var passer = require('passer');
var liveStream = require('./components/live-stream.js');
var Stream = require('./components/stream.js');





/*------------------------------------------------------------------------------
  HTTP / XML requests
------------------------------------------------------------------------------*/

passer.publicFolder = "public";
passer.listen(8080);






/*------------------------------------------------------------------------------
  Setup LiveStream
------------------------------------------------------------------------------*/

var metaStream = new Stream();
metaStream.prevChunk = {};

var albumArt = new Buffer('');

liveStream.player.on('newSong', function(meta){
  console.log('ID',liveStream.player.songId);
  albumArt = meta.picture[0];
  metaStream.write(meta);
  metaStream.prevChunk = meta;
});

passer.get('/stream.mp3', liveStream.pass, {fullBody: false});

passer.get('/stream/get/info', function(req, res){
  var data = {
    listeners: liveStream.listeners,
    song: liveStream.player.currentSongData
  };
  data.song.currentTime = (Date.now() - data.song.startTime)/1000;
  delete data.song.startTime;
  delete data.song.picture;
  res.end(JSON.stringify(data));
}, {fullBody: false});

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
}, {fullBody: false});

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
}, {fullBody: false});

passer.get('/stream/get/image', function(req, res){
  if (albumArt && typeof(albumArt) === 'object' && albumArt.type){
    var type = albumArt.type || 'jpg';

    res.writeHead(200, {
      'Content-Type': passer.documentTypes[type]
    });

    res.end(albumArt.data);
  }else{
    res.writeHead(400, {});
    res.end();
  }
}, {fullBody: false});



passer.get('/like', function(req, res){
  if (typeof(req.session.data.likes) != "object"){
    req.session.data.likes = {};
  }

  if (req.session.data.likes[liveStream.player.songId] != 1){
    liveStream.player.library.like(liveStream.player.songId);

    req.session.data.likes[liveStream.player.songId] = 1;
  }

  res.end("true");
});

passer.get('/dislike', function(req, res){
  if (typeof(req.session.data.dislikes) != "object"){
    req.session.data.dislikes = {};
  }

  if (req.session.data.dislikes[liveStream.player.songId] != 1){
    liveStream.player.library.dislikes(liveStream.player.songId);

    req.session.data.dislikes[liveStream.player.songId] = 1;
  }

  res.end("true");
});

passer.get('/request/*', function(req, res){
  var songId = req.url.substr(9) || req.query.id;
  console.log(req.query.id);

  liveStream.player.queue(songId);

  res.end("true");
});

passer.get('/request', function(req, res){
  var songId = req.url.substr(9) || req.query.id;
  console.log(req.query.id);

  liveStream.player.queue(songId);

  res.end("true");
});
