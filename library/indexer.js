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

function GetMeta(file, callback, fail, options){
  if (typeof(callback) != 'function'){
    return;
  }
  if (typeof(fail) != 'function' && options === undefined && typeof(fail) == 'object'){
    options = fail;
  }
  if (typeof(options) != 'object'){
    options = {};
  }

  mm(fs.createReadStream(file), {duration: options.duration}, function(err, meta){
    if (err){
      if (typeof(fail)=="function"){
        fail(err);
      }else{
        console.log('***Error: ', err);
      }
    }else{
      meta.artist.concat(meta.albumartist);
      delete meta.albumartist;
      callback(meta);
    }
  });
}

function GetFileInfo(path, callback, fail){
  if (typeof(callback) == 'function'){
    fs.stat(path, function(err, stats){
      if (err){
        if (typeof(fail) == 'function'){
          fail(err);
        }else{
          console.error(err);
        }
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
  info: {
    title: {},
    album: {},
    artist: {},
    genre: {},
    no: {},
  }
};

var unscanned = [];
var scanning = false;

function SongStats(){
  return {
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
    21: {listeners: 0, likes: 0, dislikes: 0},
    22: {listeners: 0, likes: 0, dislikes: 0},
    23: {listeners: 0, likes: 0, dislikes: 0},
  };
}


function Save(){
  var data = {};
  data = {
    files: library.files,
    stats: {
      list: library.stats.list
    }
  };
  data = JSON.stringify(data);
  fs.writeFileSync('./library/data.json', JSON.stringify(data));

  console.log('save');
}
function Load(){
  if (fs.existsSync('./library/data.json')){
    var data = fs.readFileSync('./library/data.json', 'utf8');
    data = JSON.parse(JSON.parse(data));

    for (let index in data.stats.list){
      library.stats.list[data.files.indexOf(data.files[index])] = data.stats.list[index];
      if (data.stats.list[index][Time()].listeners !== 0){
        console.log(index, data.stats.list[index][Time()]);
      }
    }
  }
}

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
          library.stats.list[id] = new SongStats();

          unscanned.push(library.files[id]);
        }
      }else{
        unscanned.push(file);
      }
    }
  }

  library.stats.random = new random.statistics();
  for (let item in library.stats.list){
    library.stats.random.stats[item] = item;
  }
  library.stats.random.weightingCalculator = function(item, name){
    item = library.stats.list[item];
    var time = Time();

    var listeners = 1+ item[Clamp(time+5, 0, 23, true)].listeners/12 + item[Clamp(time+4, 0, 23, true)].listeners/10 + item[Clamp(time+3, 0, 23, true)].listeners/8 + item[Clamp(time+2, 0, 23, true)].listeners/4 + item[Clamp(time+1, 0, 23, true)].listeners/2 + item[Clamp(time, 0, 23, true)].listeners + item[Clamp(time-1, 0, 23, true)].listeners/2 + item[Clamp(time-2, 0, 23, true)].listeners/4 + item[Clamp(time-3, 0, 23, true)].listeners/8 + item[Clamp(time-4, 0, 23, true)].listeners/10 + item[Clamp(time-5, 0, 23, true)].listeners/12;
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

function ScanSongLoop(onFinish){
  scanning = true;

  var finish = function(){
    setTimeout(function () {
      unscanned.splice(0,1); //remove scanned song
      ScanSongLoop(onFinish);
    }, 0);
  };

  if (unscanned.length <= 0){
    if (typeof(onFinish) == "function"){
      scanning = false;
      onFinish();
    }
    return;
  }


  var index = library.files.indexOf(unscanned[0]);
  if (index != -1){
    GetMeta(unscanned[0], function(meta){
      if (meta.title === ''){
        meta.title = 'unknown';
      }
      if (meta.album === ''){
        meta.album = 'unknown';
      }

      if (typeof(library.info.title[meta.title]) != "object"){
        library.info.title[meta.title] = [];
      }
      library.info.title[meta.title].push(index);

      if (typeof(library.info.album[meta.album]) != "object"){
        library.info.album[meta.album] = [];
      }
      library.info.album[meta.album].push(index);

      if (typeof(library.info.no[meta.track.no]) != "object"){
        library.info.no[meta.track.no] = [];
      }
      library.info.no[meta.track.no].push(index);

      for (let artist of meta.artist){
        if (typeof(library.info.artist[artist]) != "object"){
          library.info.artist[artist] = [];
        }
        library.info.artist[artist].push(index);
      }

      for (let genre of meta.genre){
        if (typeof(library.info.genre[genre]) != "object"){
          library.info.genre[genre] = [];
        }
        library.info.genre[genre].push(index);
      }


      finish();
    }, function(err){
      unscanned.splice(0,1); //remove scanned song
      scanning = false;
    });
  }else{
    finish();
  }
}


module.exports = {
  library: library,
  list: function(type, item){
    if (type == 'title' || type == 'album' || type == 'artist' || type == 'genre'){
      if (typeof(item) != 'string'){
        var list = [];
        for (let key in library.info[type]){
          list.push(key);
        }

        return list;
      }else{
        return library.info[type][item];
      }
    }else{
      return null;
    }
  },
  init: function(settings){
    SongScan(settings);
  },
  random: function(){return library.stats.random.randomItem();},
  time: Time,
  clamp: Clamp,
  getMeta: GetMeta,
  stats: {
    scanning: scanning,
    unscanned: unscanned
  },
  getFileInfo: GetFileInfo,
  getSongInfo: function(songId){
    var info = {
      title: '',
      album: '',
      genre: [],
      artist: [],
      no: 0,
    };

    songId = parseInt(songId);

    for (let key in library.info.title){
      if (library.info.title[key].indexOf(songId) != -1){
        info.title = key;
      }
    }

    for (let key in library.info.album){
      if (library.info.album[key].indexOf(songId) != -1){
        info.album = key;
      }
    }

    for (let key in library.info.genre){
      if (library.info.genre[key].indexOf(songId) != -1){
        info.genre.push(key);
      }
    }

    for (let key in library.info.artist){
      if (library.info.artist[key].indexOf(songId) != -1){
        info.artist.push(key);
      }
    }

    for (let key in library.info.no){
      if (library.info.no[key].indexOf(songId) != -1){
        info.no = key;
      }
    }

    return info;
  }
};


setInterval(function () {

  if (!scanning && unscanned.length>0){
    ScanSongLoop(function(){
      console.log("Finished Meta Scan");
      Save();
    });
  }
}, 500);

Load();


setInterval(function () {
  Save();
}, 300000);
