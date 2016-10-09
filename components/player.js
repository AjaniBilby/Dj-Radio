var fs = require('fs');
var mm = require('musicmetadata');
var Stream = require('./stream.js');

var lame = require('lame');

var library = require('../library/main.js');

var playlist = [];
var output = null;

var handles = {
  newSong: []
};


function PlayNext(){
  if (module.exports.listeners){
    library.songEnd(module.exports.currentSong, module.exports.listeners.num || 0);
  }


  var start = Date.now();

  //Check playlist
  if (!playlist[0]){
    //If no next song
    module.exports.currentSong = library.getRandom();
    playlist.push(module.exports.currentSong);
  }

  //TODO check that file is valid
  if (!fs.existsSync(playlist[0])){
    //If the file doesn't exist remove it from the playlist and try again
    playlist.splice(0, 1);
    PlayNext();
    return;
  }

  var file = playlist[0];
  playlist.splice(0, 1);

  var decoder = lame.Decoder();
  decoder.on('data', function(chunk){
    module.exports.stream.write(chunk);
  });

  var output = fs.createReadStream(file);
  output.on('data', function(chunk){
    decoder.write(chunk);
  });

  library.getMeta(file, function(meta){
    console.log('Now Playing '+ meta.title);



    var timeElapsed = Date.now() - start;
    meta.startTime = start;
    module.exports.currentSongData = meta;

    setTimeout(function(){
      //After song ends
      PlayNext();
    }, (meta.duration*1000) - timeElapsed);

    if (handles){
      if (typeof(handles.newSong) == 'object'){
        for (let callback of handles.newSong){
          if (typeof(callback) == 'function'){
            callback(module.exports.currentSongData);
          }else{
            console.log(callback);
          }
        }
      }
    }
  });
}





module.exports = {
  currentSong: null,
  currentSongData: {},
  stream: new Stream(),
  queue: function(file){
    playlist.push(file);
  },
  library: library,
  on: function(type, callback){
    if (typeof(handles[type]) != 'object'){
      handles[type] = [];
    }
    handles[type].push(callback);

    return handles[type][handles[type].length-1];
  },
  listeners: 0
};


PlayNext();
