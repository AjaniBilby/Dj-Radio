var fs = require('fs');
var mm = require('musicmetadata');
var random = require('mass-random');

var userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var settings = JSON.parse(fs.readFileSync('./library/data.json', 'utf8'));

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


var fileStats = new random.statistics(songs);








module.exports = {
  stats: fileStats,
  getMeta: GetMeta,
  indexDir: IndexDir,
  getFileInfo: GetFileInfo,
  getRandom: function(){
    return fileStats.randomItem();
  }
};
