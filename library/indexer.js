var fs = require('fs');
var mm = require('musicmetadata');
var random = require('mass-random');
var object =require("object-manipulation");

var userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

function Time(){
  return parseInt(Date().split(' ')[4].split(':')[0]); //Current hour
}

function Clamp(value = 0.5, min = 0, max = 1, loop = false){
  if (value > max){
    if (loop){
      value = min;
    }else{
      value = max;
    }
  }else if (value < min){
    if (loop){
      value = max;
    }else{
      value = min;
    }
  }

  if (!loop){
    value = Clamp(value, min, max, loop);
  }

  return value;
}

function GetMeta(file, callback, options){
  mm(fs.createReadStream(file), {duration:true}, function(err, meta){
    if (err){
      console.log('***Error: ', err);
    }else{
      callback(meta);
    }
  });
}

function GetFileInfo(path, callback){
  if (typeof(callback) == 'function'){
    fs.stat(path, function(err, stats){
      if (err){
        console.error(err);
      }else{
        callback(stats);
      }
    });
  }
}

var library = {
  files: [],
  stats: {
    random: null,
    list: []
  },
  meta: [],
};

var unscanned = [];



var SongStats = {
  0: {listeners: 0, likes: 0, dislikes: 0},
  1: {listeners: 0, likes: 0, dislikes: 0},
  2: {listeners: 0, likes: 0, dislikes: 0},
  3: {listeners: 0, likes: 0, dislikes: 0},
  4: {listeners: 0, likes: 0, dislikes: 0},
  5: {listeners: 0, likes: 0, dislikes: 0},
  6: {listeners: 0, likes: 0, dislikes: 0},
  7: {listeners: 0, likes: 0, dislikes: 0},
  8: {listeners: 0, likes: 0, dislikes: 0},
  9: {listeners: 0, likes: 0, dislikes: 0},
  10: {listeners: 0, likes: 0, dislikes: 0},
  11: {listeners: 0, likes: 0, dislikes: 0},
  12: {listeners: 0, likes: 0, dislikes: 0},
  13: {listeners: 0, likes: 0, dislikes: 0},
  14: {listeners: 0, likes: 0, dislikes: 0},
  15: {listeners: 0, likes: 0, dislikes: 0},
  16: {listeners: 0, likes: 0, dislikes: 0},
  17: {listeners: 0, likes: 0, dislikes: 0},
  18: {listeners: 0, likes: 0, dislikes: 0},
  19: {listeners: 0, likes: 0, dislikes: 0},
  20: {listeners: 0, likes: 0, dislikes: 0},
  22: {listeners: 0, likes: 0, dislikes: 0},
  23: {listeners: 0, likes: 0, dislikes: 0},
};


function IndexDir(dir, recursive = true){
  var results = [];
  var data = fs.readdirSync(dir);
  for (let item of data){
    if (recursive){
      try{
        var states = fs.statSync(dir+"/"+item);
        if (states.isDirectory()){
          var folderIndex = IndexDir(dir+'/'+item);
          for (let subItem of folderIndex){
            results.push(item+'/'+subItem);
          }
        }else{
          results.push(item);
        }
      }catch (err2){
        console.error(err2);
        results.push(item);
      }
    }else{
      results.push(item);
    }
  }
  return results;
}

function SongScan(settings){
  var songs = [];
  for (let address of settings.libraryFolders){
    address = address.replace('%USERHOME%', userHome);
    address = address.replace('%DIRNAME%', __dirname);

    var index = IndexDir(address);
    for (let file of index){
      if (library.files.indexOf(file) == -1){
        extention = file.split('.');
        extention = extention[extention.length-1];

        if (extention == "mp3"){
          var id = object.firstUndefined(library.files, library.files.length+3) || library.files.length;
          library.files[id] = address+file;
          library.stats.list[id] = SongStats;

          unscanned.push(library.files[id]);
        }
      }else{
        //TODO workout if song has changed and if so check meta again
      }
    }
  }

  ScanLoop();

  library.stats.random = new random.statistics();
  for (let item in library.stats.list){
    library.stats.random.stats[item] = item;
  }
  library.stats.random.weightingCalculator = function(item, name){
    item = library.stats.list[item];
    var time = Time();

    listeners = 1+ item[Clamp(time+5, 0, 23, true)].listeners/12 + item[Clamp(time+4, 0, 23, true)].listeners/10 + item[Clamp(time+3, 0, 23, true)].listeners/8 + item[Clamp(time+2, 0, 23, true)].listeners/4 + item[Clamp(time+1, 0, 23, true)].listeners/2 + item[Clamp(time, 0, 23, true)].listeners + item[Clamp(time-1, 0, 23, true)].listeners/2 + item[Clamp(time-2, 0, 23, true)].listeners/4 + item[Clamp(time-3, 0, 23, true)].listeners/8 + item[Clamp(time-4, 0, 23, true)].listeners/10 + item[Clamp(time-5, 0, 23, true)].listeners/12;
    listeners = listeners.toFixed(2);

    var likes = 1+ item[Clamp(time+5, 0, 23, true)].likes/12 + item[Clamp(time+4, 0, 23, true)].likes/10 + item[Clamp(time+3, 0, 23, true)].likes/8 + item[Clamp(time+2, 0, 23, true)].likes/4 + item[Clamp(time+1, 0, 23, true)].likes/2 + item[Clamp(time, 0, 23, true)].likes + item[Clamp(time-1, 0, 23, true)].likes/2 + item[Clamp(time-2, 0, 23, true)].likes/4 + item[Clamp(time-3, 0, 23, true)].likes/8 + item[Clamp(time-4, 0, 23, true)].likes/10 + item[Clamp(time-5, 0, 23, true)].likes/12;

    var dislikes = 1+ item[Clamp(time+5, 0, 23, true)].dislikes/12 + item[Clamp(time+4, 0, 23, true)].dislikes/10 + item[Clamp(time+3, 0, 23, true)].dislikes/8 + item[Clamp(time+2, 0, 23, true)].dislikes/4 + item[Clamp(time+1, 0, 23, true)].dislikes/2 + item[Clamp(time, 0, 23, true)].dislikes + item[Clamp(time-1, 0, 23, true)].dislikes/2 + item[Clamp(time-2, 0, 23, true)].dislikes/4 + item[Clamp(time-3, 0, 23, true)].dislikes/8 + item[Clamp(time-4, 0, 23, true)].dislikes/10 + item[Clamp(time-5, 0, 23, true)].dislikes/12;

    var bonus = Math.ceil(likes - dislikes);
    if (bonus < 0){
      return parseFloat(listeners/bonus);
    }else if(bonus > 0){
      return parseFloat(listeners*bonus);
    }else{
      return parseFloat(listeners);
    }
  };
}

function ScanLoop(){
  var index = library.files.indexOf(unscanned[0]);
  if (index != -1){
    GetMeta(unscanned[0], function(meta){
      library.meta[index] = meta;

      unscanned.splice(0,1); //remove scanned meta
      ScanLoop();
    });
  }else{
    unscanned.splice(0,1); //remove scanned meta
    ScanLoop();
  }
}


module.exports = {
  library: library,
  init: function(settings){
    SongScan(settings);
  },
  random: function(){return library.stats.random.randomItem();},
  time: Time,
  clamp: Clamp,
  getMeta: GetMeta,
  getFileInfo: GetFileInfo
};
