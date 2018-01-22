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
        return;
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
          
          meta.artist = meta.artist.concat(meta.albumartist);
          for (let i=0; i<meta.artist.length; i++){
            if (meta.artist[i].indexOf('/') != -1){
              let sect = meta.artist.splice(i, 1)[0];
              sect = sect.split('/');
          
              meta.artist = meta.artist.concat(sect);
            }
          }

          db.song.add({
            title:     meta.title,
            album:     meta.album,
            artist:    meta.artist,
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

                  var path = './data/icons/'+id+'.jpg';
                  fs.writeFile(path, meta.picture[0].data ,()=>{});
                })
              }

              //This is done after the song has been saved because then other songs will be able to reference it's content correctly
              loop(i+1);
            })
            .catch((e)=>{
              console.error(`Failed to Catalog "${file}`);
              console.error('\t'+e);
              loop(i+1);
            })
        }else{
          loop(i+1);
        }
      });
    }

    GetFiles(folder).then((parse)=>{
      files = parse;
      console.log(`Scanning ${files.length} files`);
      loop(0);
    });
  });
}

db.initialize().then(()=>{
  console.log('Songs', db.table.song.rows);
});