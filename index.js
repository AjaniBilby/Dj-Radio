var passer = require('passer');
var app = new passer.app();
var liveStream = require('./components/live-stream.js');
var Stream = require('./components/stream.js');

var logins = {
  admin: "admin"
};





/*------------------------------------------------------------------------------
  HTTP / XML requests
------------------------------------------------------------------------------*/

app.publicFolder = "public";
app.listen(8080);

app.addAuth(
  ["/dj/*"],
  function(req, res){
    return req.session.loggedIn;
  },
  function(req, res){
    res.writeHead(302, {
      'Location': 'http://'+req.headers.host+'/dj/login'
    });
    res.end("redirecting");

    return;
  },
  ["/dj/login*"]
);






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
  meta.id = liveStream.player.songId;
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

app.get('/server/time', function(req, res){
  res.end(Date());
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
    return;
  }else{
    res.writeHead(404, {});
    res.end();
    return;
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
  return;
}, {fullBody: false});
app.get('/stream/get/prevSongs', function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });

  res.end(JSON.stringify(prevSong));
  return;
});

app.get('/like*', function(req, res){
  if (typeof(req.session.data.likes) != "object"){
    req.session.data.likes = {};
  }

  var id = liveStream.player.songId;
  if (req.url.length > 5){
    id = parseInt(req.url.substr(6, req.url.length-1));
  }

  if (isNaN(id)){
    res.end('false');
    return;
  }

  if (req.session.data.likes[id] != 1){
    liveStream.player.library.like(id);

    req.session.data.likes[id] = 1;
  }

  res.end("true");
  return;
});
app.get('/dislike/*', function(req, res){
  if (typeof(req.session.data.dislikes) != "object"){
    req.session.data.dislikes = {};
  }

  var id = liveStream.player.songId;
  if (req.url.length > 5){
    id = parseInt(req.url.substr(6, req.url.length-1));
  }

  if (isNaN(id)){
    res.end('false');
    return;
  }

  if (req.session.data.dislikes[id] != 1){
    liveStream.player.library.dislike(id);

    req.session.data.dislike[id] = 1;
  }

  res.end("true");
  return;
});

app.get('/dj/login/*', function(req, res){
  var input = req.url.slice(10);
  input = input.split('/');
  var username = decodeURIComponent(input[0]);
  var password = decodeURIComponent(input[1]);

  if (typeof(logins[username]) == "string"){
    if (logins[username] == password){
      req.session.loggedIn = true;
      res.end('true');
      return;
    }
  }

  res.end('false');
  return;
});
app.get('/dj/request/*', function(req, res){
  var songId = req.url.substr(12);

  res.end(String(liveStream.player.queue(liveStream.player.library.index.library.files[songId])));
  return;
});
app.get('/dj/list/*', function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });

  req.url = decodeURIComponent(req.url);
  var type = req.url.split('/')[3];

  if (req.url.split('/').length == 4){
    res.end(JSON.stringify(liveStream.player.library.list(type)));
    return;
  }else{
    var item = req.url.split('/');
    item.splice(0,4);
    item = item.join('/');
    res.end(JSON.stringify(liveStream.player.library.list(type, item)));
    return;
  }
});
app.get('/dj/song/meta/*', function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });

  var id = req.url.substr(14, req.url.length);
  if (id.indexOf(',') == -1){
    res.end(JSON.stringify(liveStream.player.library.getSongInfo(id)));
    return;
  }else{
    var ids = id.split(',');
    var count = 0;
    var response = [];
    var loop = function(){
      response.push(liveStream.player.library.getSongInfo(ids[count]));
      count += 1;
      if (count < ids.length){
        loop();
      }else{
        res.end(JSON.stringify(response));
        return;
      }
    };
    loop();
  }
});
app.get('/dj/song/stats/*', function(req, res){
  var id = req.url.substr(15, req.url.length);

  if (id == 'all'){
    res.end(JSON.stringify(liveStream.player.library.index.library.stats.list));
  }else{
    res.end(JSON.stringify(liveStream.player.library.index.library.stats.list[id]));
  }
});
app.get('/dj/song/picture/*', function(req, res){
  res.writeHead(200, {
    'Content-Type': passer.documentTypes.jpg,
    'Cache-Control': "no-cache"
  });

  var id = req.url.substr(17, req.url.length);
  liveStream.player.library.getMeta(liveStream.player.library.index.library.files[id], function(meta){
    res.end(JSON.stringify(meta.picture[0].data));
  });

  return;
});
app.get('/dj/playlist', function(req, res){
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });

  var data = [metaStream.prevChunk];
  for (let file of liveStream.player.playlist){
    var id = liveStream.player.library.index.library.files.indexOf(file);
    var song = liveStream.player.library.getSongInfo(id);
    song.id = id;
    song.file = file;

    data.push(song);
  }

  res.end(JSON.stringify(data));
  return;
});
app.get('/dj/playlist/remove/*', function(req, res){
  var input = req.url;
  input = input.slice(20).split('/');
  var id = input[0];
  input = decodeURIComponent(input.splice(1).join('/'));

  if (liveStream.player.playlist[id] == input){
    liveStream.player.playlist.splice(id, 1);
    res.end('true');
    return;
  }else{
    res.end('false');
    return;
  }
});
app.get('/dj/all/song/meta', function(req, res){
  res.end(JSON.stringify(liveStream.player.library.index.library.info));
});

app.get('/stats/indexer', function(req, res){
  res.end(JSON.stringify(liveStream.player.library.index.stats));
  return;
});
