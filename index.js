var library = require('./component/library.js');
let player = require('./component/player.js');
let app = require('passer');
let fs = require('fs');

let listeners = 0;


player.pick = async function(){
  return await library.pick();
}

app.publicFolder = './public/';
app.listen(8080);

app.get('/stream', function(req, res){
  res.setHeader('Content-Type',      'audio/mpeg');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('ice-audio-info',    'bitrate=128;samplerate=22050');
  res.setHeader('Cache-Control',     "no-cache");
  res.setHeader('Connection',        'Keep-Alive');
  listeners += 1;

  let local = function(chunk){
    res.write(chunk);
  }

  player.stream.on('data', local);

  req.on('close', function(){
    listeners -= 1;

    player.stream.removeListener('data', local);
    return;
  })
})
app.get('/history', (req, res)=>{
  res.end(JSON.stringify(player.history));
});
app.get('/icon/*', async (req,res)=>{
  res.setHeader('Content-Type', 'image/jpeg');

  let success = false;
  try {
    success = await app.parseFile(req, res, `./data/icons/${req.wildcards[0]}.jpg`);
  }catch(e){}

  if (!success){
    app.on404(req, res);
  }
})
app.get('/queue', (req,res)=>{
  res.end(JSON.stringify(player.queue));
})
app.get('/listeners', (req, res)=>{
  res.end(listeners.toString());
})


//Get Song Data
app.get('/song/preview/+*', function(req, res){
  let id = parseInt(req.wildcards[0] + req.wildcards[1]);

  if (isNaN(id) || id > library.db.song.rows){
    app.on404(req, res);
    return;
  }

  library.db.table.song.get(id)
    .then((tuple)=>{
      fs.stat(tuple.data.path, (err, stats)=>{
        if (err){
          app.on404(req, res);
          return;
        }
        let sp = Math.floor(stats.size/2);
        let stream = fs.createReadStream(tuple.data.path, {
          start: sp,
          end: sp+220500
        });
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', 220500);
        stream.pipe(res);

        req.connection.on('close', ()=>{
          stream.close();
        })
      });
    })
    .catch((e)=>{
      app.on404(req, res);
    })
});
app.get('/songs/+*', function(req, res){
  let input = (req.wildcards[0] + req.wildcards[1]).split(',');
  let valid = false;
  let songs = [];

  for (let i=0; i<input.length; i++){
    input[i] = parseInt(input[i]);
    if (!isNaN(input[i]) && input[i] < library.db.table.song.rows){
      songs[i] = input[i];
      valid = true;
    }else{
      songs[i] = null;
    }
  }

  if (!valid){
    res.end(JSON.stringify(songs));
    return;
  }

  library.db.song.get(songs)
    .then((songs)=>{
      res.end(JSON.stringify(songs));
    })
});
app.get('/album/+*', function(req, res){
  let album = parseInt(req.wildcards[0] + req.wildcards[1]);

  if (isNaN(album) || album > library.db.table.album.rows){
    app.on404(req, res);
    return;
  }
  
  library.db.table.album.get(album)
    .then((tuple)=>{
      if (tuple.blank){
        app.on404(req, res);
        return;
      }

      if (req.query.songs === undefined){
        res.end(JSON.stringify({name: tuple.data.name}));
        return;
      }

      let albumName = tuple.data.name;
      let songs = [];
      library.db.table.song.forEach((index, tuple)=>{
        if (tuple.blank){
          return;
        }

        if (tuple.data.album == album){
          songs.push(index);
        }
      }, ()=>{
        res.end(
          JSON.stringify({
            name: albumName,
            songs: songs,
          })
        );
      });
    })
    .catch(()=>{
      res.statusCode = 500;
      res.end('Internal Server Error')
      return;
    });
});
app.get('/year/+*', function(req, res){
  let year = parseInt(req.wildcards[0] + req.wildcards[1]);

  if (isNaN(year) || year > library.db.table.song.rows){
    app.on404(req, res);
    return;
  }
  
  let songs = [];
  library.db.table.song.forEach((index, tuple)=>{
    if (tuple.blank){
      app.on404(req, res);
      return;
    }

    if (tuple.data.year == year){
      songs.push(index);
    }
  }, ()=>{
    res.end(
      JSON.stringify({name: year, songs: songs})
    );
  })
});
app.get('/artist/+*', function(req, res){
  let artist = parseInt(req.wildcards[0] + req.wildcards[1]);

  if (isNaN(artist) || artist > library.db.table.artist.rows){
    app.on404(req, res);
    return;
  }
  
  library.db.table.artist.get(artist)
    .then((tuple)=>{
      if (tuple.blank){
        app.on404(req, res);
        return;
      }

      if (req.query.songs === undefined){
        res.end(JSON.stringify({name: tuple.data.name}));
        return;
      }

      let artistName = tuple.data.name;
      let songs = [];
      library.db.table.song.forEach((index, tuple)=>{
        if (tuple.blank){
          return;
        }

        if (
          tuple.data.artist1 == artist ||
          tuple.data.artist2 == artist ||
          tuple.data.artist3 == artist ||
          tuple.data.artist4 == artist ||
          tuple.data.artist5 == artist
        ){
          songs.push(index);
        }
      }, ()=>{
        res.end(
          JSON.stringify({
            name: artistName,
            songs: songs,
          })
        );
      });
    })
    .catch(()=>{
      res.statusCode = 500;
      res.end('Internal Server Error')
      return;
    });
});
app.get('/genre/+*', function(req, res){
  let genre = parseInt(req.wildcards[0] + req.wildcards[1]);

  if (isNaN(genre) || genre > library.db.table.genre.rows){
    app.on404(req, res);
    return;
  }
  
  library.db.table.genre.get(genre)
    .then((tuple)=>{
      if (tuple.blank){
        app.on404(req, res);
        return;
      }

      if (req.query.songs == undefined){
        res.end(JSON.stringify({name: tuple.data.name}));
        return;
      }

      let genreName = tuple.data.name;
      let songs = [];
      library.db.table.song.forEach((index, tuple)=>{
        if (tuple.blank){
          return;
        }

        if (
          tuple.data.genre1 == genre ||
          tuple.data.genre2 == genre ||
          tuple.data.genre3 == genre ||
          tuple.data.genre4 == genre ||
          tuple.data.genre5 == genre
        ){
          songs.push(index);
        }
      }, ()=>{
        res.end(
          JSON.stringify({
            name: genreName,
            songs: songs,
          })
        );
      });
    })
    .catch(()=>{
      res.statusCode = 500;
      res.end('Internal Server Error')
      return;
    });
});