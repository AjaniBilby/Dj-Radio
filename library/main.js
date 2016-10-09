var fs = require('fs');
var mm = require('musicmetadata');
var random = require('mass-random');

var userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var settings = JSON.parse(fs.readFileSync('./library/settings.json', 'utf8'));

function GetMeta(file, callback, options){
  mm(fs.createReadStream(file), {duration:true}, function(err, meta){
    if (err){
      console.log('***Error: ', err);
    }else{
      callback(meta);
    }
  });
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




var songs = [];
for (let address of settings.libraryFolders){
  address = address.replace('%USERHOME%', userHome);
  address = address.replace('%DIRNAME%', __dirname);

  var index = IndexDir(address);
  for (let file of index){
    extention = file.split('.');
    extention = extention[extention.length-1];

    if (extention == "mp3"){
      songs.push(address+file);
    }
  }
}

console.log('loaded library ('+songs.length+' songs)');


//var fileStats = new random.statistics(songs);

var fileStats = new random.statistics();

class SongStats{}
SongStats.prototype['0'] = 1;
SongStats.prototype['1'] = 1;
SongStats.prototype['2'] = 1;
SongStats.prototype['3'] = 1;
SongStats.prototype['4'] = 1;
SongStats.prototype['5'] = 1;
SongStats.prototype['6'] = 1;
SongStats.prototype['7'] = 1;
SongStats.prototype['8'] = 1;
SongStats.prototype['9'] = 1;
SongStats.prototype['10'] = 1;
SongStats.prototype['11'] = 1;
SongStats.prototype['12'] = 1;
SongStats.prototype['13'] = 1;
SongStats.prototype['14'] = 1;
SongStats.prototype['15'] = 1;
SongStats.prototype['16'] = 1;
SongStats.prototype['17'] = 1;
SongStats.prototype['18'] = 1;
SongStats.prototype['19'] = 1;
SongStats.prototype['20'] = 1;
SongStats.prototype['21'] = 1;
SongStats.prototype['22'] = 1;
SongStats.prototype['23'] = 1;


fileStats.weightingCalculator = function(item, name){

  var time = parseInt(Date().split(' ')[4].split(':')[0]); //Current Hour

  value = item[Clamp(time+5, 0, 23, true)]/12 + item[Clamp(time+4, 0, 23, true)]/10 + item[Clamp(time+3, 0, 23, true)]/8 + item[Clamp(time+2, 0, 23, true)]/4 + item[Clamp(time+1, 0, 23, true)]/2 + item[Clamp(time, 0, 23, true)] + item[Clamp(time-1, 0, 23, true)]/2 + item[Clamp(time-2, 0, 23, true)]/4 + item[Clamp(time-3, 0, 23, true)]/8 + item[Clamp(time-4, 0, 23, true)]/10 + item[Clamp(time-5, 0, 23, true)]/12;

  return parseFloat(value.toFixed(2));
};

for (index in songs){
  fileStats.stats[index] = new SongStats();
}

console.log(fileStats.randomItem());








module.exports = {
  stats: fileStats,
  getMeta: GetMeta,
  indexDir: IndexDir,
  getFileInfo: GetFileInfo,
  getRandom: function(){
    return songs[fileStats.randomItem()];
  },
  songEnd: function(file, listeners){
    var index = songs.indexOf(file);

    if (index != -1){
      var time = parseInt(Date().split(' ')[4].split(':')[0]); //Current Hour
      fileStats.stats[index][time] += listeners/10;

      console.log(index + ': ' + fileStats.stats[index]);

      return true;
    }

    return false;
  }
};
