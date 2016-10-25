var passer = require('passer');
var app = new passer.app();
var liveStream = require('./components/live-stream.js');
var Stream = require('./components/stream.js');





/*------------------------------------------------------------------------------
  HTTP / XML requests
------------------------------------------------------------------------------*/

app.publicFolder = "public";
app.listen(8080);






/*------------------------------------------------------------------------------
  Setup LiveStream
------------------------------------------------------------------------------*/

var metaStream = new Stream();
metaStream.prevChunk = {
  title: 'title',
  album: 'album',
  artist: [],
  genre: [],
  first: true
};

var albumArt = {};
var prevSong = [];

liveStream.player.on('newSong', function(meta){
  if (metaStream.prevChunk.first !== true){
    prevSong.reverse();
    prevSong.push(metaStream.prevChunk);
    prevSong.reverse();
    prevSong.splice(10);
  }
  albumArt = meta.picture[0];
  metaStream.write(meta);
  metaStream.prevChunk = meta;
});

app.get('/stream.mp3', liveStream.pass, {fullBody: false});
app.get('/stream/metadata', function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chuncked',
    'Cache-Control': "no-cache",
    'Connection': 'Keep-Alive'
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
app.get('/stream/listeners', function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chuncked',
    'Cache-Control': "no-cache",
    'Connection': 'Keep-Alive'
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
app.get('/stream/get/image', function(req, res){
  if (albumArt && typeof(albumArt) === 'object'){
    var type = albumArt.type || 'jpg';

    res.writeHead(200, {
      'Content-Type': passer.documentTypes[type],
      'Cache-Control': "no-cache"
    });

    res.end(albumArt.data);
  }else{
    res.writeHead(404, {});
    res.end();
  }
}, {fullBody: false});

app.get('/stream/get/info', function(req, res){
  var data = {
    listeners: liveStream.listeners,
    song: liveStream.player.currentSongData
  };
  data.song.currentTime = (Date.now() - data.song.startTime)/1000;
  delete data.song.startTime;
  delete data.song.picture;
  res.end(JSON.stringify(data));
}, {fullBody: false});
app.get('/stream/get/prevSongs', function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });

  res.end(JSON.stringify(prevSong));
});

app.get('/like', function(req, res){
  if (typeof(req.session.data.likes) != "object"){
    req.session.data.likes = {};
  }

  if (req.session.data.likes[liveStream.player.songId] != 1){
    liveStream.player.library.like(liveStream.player.songId);

    req.session.data.likes[liveStream.player.songId] = 1;
  }

  res.end("true");
});
app.get('/dislike', function(req, res){
  if (typeof(req.session.data.dislikes) != "object"){
    req.session.data.dislikes = {};
  }

  if (req.session.data.dislikes[liveStream.player.songId] != 1){
    liveStream.player.library.dislikes(liveStream.player.songId);

    req.session.data.dislikes[liveStream.player.songId] = 1;
  }

  res.end("true");
});

app.get('/dj/request/*', function(req, res){
  var songId = req.url.substr(9) || req.query.id;
  console.log(req.query.id);

  liveStream.player.queue(songId);

  res.end("true");
});
