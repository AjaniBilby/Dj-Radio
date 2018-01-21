var db = require('./database/db.js');
var mm = require('musicmetadata');
var fs = require('fs');


//Setup icon info
var base64 = new (require('custom-radix'))();


//Get all files in a folder
function GetFiles(folder){
  return new Promise((resolve, reject)=>{
    fs.lstat(folder, (err, stats)=>{
      if (err){
        resolve([]);
        return;
      }

      if (stats.isFile()){
        if (folder.indexOf('.mp3') == folder.length-4){
          resolve([folder]);
        }else{
          resolve([]);
        }
        return;
      }

      if (stats.isDirectory()){
        let workers = 0;
        let res = [];
        
        fs.readdir(folder, (err, files)=>{
          workers = files.length;

          //If it is an empty directory
          if (workers == 0){
            resolve([]);
          }

          for (let file of files){
            GetFiles(folder+'/'+file).then((files) => {
              res = res.concat(files);
              workers -= 1;
  
              if (workers == 0){
                resolve(res);
              }
            });
          }
        });
      }
    });
  });
}

function Catalog(folder){
  return new Promise((resolve, reject) => {
    let status = 0;
    let files = [];

    function loop(i){
      if (i == files.length){
        resolve();
      }

      let nstatus = parseInt(i/files.length*100);
      if (nstatus != status){
        status = nstatus;
        console.log(`Scanning ${status}%`);
      }

      let file = files[i];

      mm(fs.createReadStream(file), (err, meta)=>{
        if (!err){
          var hasIcon = meta.picture[0] && meta.picture[0].data && meta.picture[0].format == 'jpg';

          db.song.add({
            title:     meta.title,
            album: {
              name:    meta.album,
              icon:    ''
            },
            artist:    meta.artist.concat(meta.albumartist),
            year:      meta.year,
            track:     meta.track.no,
            genre:     meta.genre,
            duration:  meta.duration
          }, file)
            .then(()=>{
              //Now that the album is definitly defined, find it's id, then tell it the path of the icon
              if (hasIcon){
                db.album.exist(meta.album).then((id)=>{
                  if (id == -1){
                    return;
                  }

                  var path = `./data/icons/${id}.jpg`;
                  fs.writeFile(path, meta.picture[0].data ,()=>{});
    
                  tuple = db.table.album.tuple();
                  tuple.data.name = meta.album;
                  tuple.data.icon = path;
                  db.table.album.overwrite(id, tuple);
                })
              }

            })
            .catch((e)=>{
              console.error(`Failed to Catalog "${file}`);
              console.error('\t'+e);
            })
        }

        loop(i+1);
      });
    }

    GetFiles(folder).then((parse)=>{
      files = parse;
      console.log(`Scanning ${files.length} files`);
      loop(0);
    });
  });
}

Catalog('e:/user/music')
  .then(()=>{
    console.log('complete');
  })
  .catch((e)=>{
    console.error(e);
  })

// db.table.song.get(2133).then((tuple) => {
//   console.log(tuple);
// })