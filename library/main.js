var fs = require('fs');
var mm = require('musicmetadata');
var random = require('mass-random');
var indexer = require('./indexer.js');

var userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var settings = JSON.parse(fs.readFileSync('./library/settings.json', 'utf8'));


indexer.init(settings);









module.exports = {
  index: indexer,
  getSong: function(id){
    if (typeof(id) != "number"){
      var index = indexer.library.files.indexOf(id);

      return {file: id, stats: indexer.library.files[index], meta: indexer.library.meta[index]};
    }

    return {file: indexer.library.files[id], stats: indexer.library.files[id], meta: indexer.library.meta[id]};
  },
  getMeta: indexer.getMeta,
  getFileInfo: indexer.getFileInfo,
  like: function(songId){
    var time = parseInt(Date().split(' ')[4].split(':')[0]); //Current Hour

    if (typeof(indexer.library.stats.list[songId][time]) == "object"){
      indexer.library.stats.list[songId][time].likes += 1;
      return indexer.library.stats.list[songId][time];
    }
    return null;
  },
  dislike: function(songId){
    if (typeof(indexer.library.stats.list[songId][time]) == "object"){
      indexer.library.stats.list[songId][time].dislikes += 1;
      return indexer.library.stats.list[songId][time];
    }
    return null;
  },
  getRandom: function(){
    var id = indexer.random();
    return {song: indexer.library.files[id], id: id};
  },
  songEnd: function(file, listeners){
    var index = indexer.library.files.indexOf(file);

    if (index != -1){
      var time = parseInt(Date().split(' ')[4].split(':')[0]); //Current Hour
      indexer.library.stats.list[index][time].listeners += listeners;

      return true;
    }

    return false;
  }
};
