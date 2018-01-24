var dbClass = require('./classes.js');
var fs = require('fs');






//Setup the table cache and assorted files
var table = {};
if (!fs.existsSync('./data/song.db')){
  fs.writeFileSync('./data/song.db', '');
}
if (!fs.existsSync('./data/album.db')){
  fs.writeFileSync('./data/album.db', '');
}
if (!fs.existsSync('./data/artist.db')){
  fs.writeFileSync('./data/artist.db', '');
}
if (!fs.existsSync('./data/genre.db')){
  fs.writeFileSync('./data/genre.db', '');
}
if (!fs.existsSync('./data/icons')){
  fs.mkdirSync('./data/icons');
}


/*------------------------------------------
    Setup Song Table
------------------------------------------*/
table.song = new dbClass('song', './data/song.db');
//Song ID is not needed since it will just be the row
table.song.addField('title',   'string', 80);
table.song.addField('path',    'string', 200);
table.song.addField('length',  'int',    3);     //Length of the song in ms
table.song.addField('album',   'int',    4);     //Each album will have a unique ID
table.song.addField('track',   'int',    2);
table.song.addField('year',    'int',    2);
table.song.addField('artist1', 'int',    3);     //Each artist has a unique ID, maximum five artists per song
table.song.addField('artist2', 'int',    3);
table.song.addField('artist3', 'int',    3);
table.song.addField('artist4', 'int',    3);
table.song.addField('artist5', 'int',    3);
table.song.addField('genre1',  'int',    2);     //Each genre has a unique ID, maximum five genres per song
table.song.addField('genre2',  'int',    2);     //NOTE: geners have a smaller ID number because there are less of them (65536)
table.song.addField('genre3',  'int',    2);
table.song.addField('genre4',  'int',    2);
table.song.addField('genre5',  'int',    2);


/*------------------------------------------
    Setup Album Table
------------------------------------------*/
table.album = new dbClass('Album', './data/album.db');
table.album.addField('name', 'string', 60);
//A path to the icon does not need to be stored since it can be assumed that it would be in the icons folder if it existed

//Make sure that the first album is empty so there can be null references
let empty = table.album.tuple();
empty.data.name = 'Unknown';
table.album.overwrite(0, empty);


/*------------------------------------------
    Setup Artist Table
------------------------------------------*/
table.artist = new dbClass('Artist', './data/artist.db');
table.artist.addField('name', 'string', 50);

//Make sure that the first album is empty so there can be null references
empty = table.artist.tuple();
empty.data.name = '__undefined__';
table.artist.overwrite(0, empty);



/*------------------------------------------
    Setup Genre Table
------------------------------------------*/
table.genre = new dbClass('Genre', './data/genre.db')
table.genre.addField('name', 'string', 40);

//Make sure that the first album is empty so there can be null references
empty = table.genre.tuple();
empty.data.name = '__undefined__';
table.genre.overwrite(0, empty);
delete empty;





/*------------------------------------------
    Setup artist database handles
------------------------------------------*/
let artist = {};
/**
 * Test if an artist exists
 * @param {string} artist 
 * @returns {number} index
 */
artist.exist = function(name){  
  return new Promise((resolve, reject) => {
    table.artist.forEach((i, tuple) => {
      if (tuple.data.name == name){
        resolve(i);
        return false; //Break the loop
      }
    }, ()=>{
      resolve(-1);
      return false;
    });
  })
}
/**
 * Add an artist to the database if it does not exist already
 * @param {string} artist 
 * @returns {number} index
 */
artist.define = async function(name){
  let index = await artist.exist(name);

  if (index === -1){
    let tuple = table.artist.tuple();
    tuple.data.name = name;

    index = await table.artist.insert(tuple);
  }

  return index;
}





/*------------------------------------------
    Setup album database handles
------------------------------------------*/
var album = {};
/**
 * Test if an album exists
 * @param {string} album 
 * @returns {number} index
 */
album.exist = function(name){  
  return new Promise((resolve, reject) => {
    table.album.forEach((i, tuple) => {

      if (tuple.data.name == name){
        resolve(i);

        return false; //Break the loop
      }
    }, ()=>{
      resolve(-1);
    });
  })
}
/**
 * Add an album to the database if it does not exist already
 * @param {string} album 
 * @param {string} iconPath path to the album art (optional)
 * @returns {number} index
 */
album.define = async function(name){
  let index = await album.exist(name);

  if (index === -1){
    let tuple = table.album.tuple();
    tuple.data.name = name;

    index = await table.album.insert(tuple);
  }

  return index;
}





/*------------------------------------------
    Setup genre database handles
------------------------------------------*/
var genre = {};
/**
 * Test if an genre exists
 * @param {string} genre 
 * @returns {number} index
 */
genre.exist = function(name){  
  return new Promise((resolve, reject) => {
    table.genre.forEach((i, tuple) => {
      if (tuple.data.name == name){
        resolve(i);
        return false; //Break the loop
      }
    }, ()=>{
      resolve(-1);
      return false;
    });
  })
}
/**
 * Add an genre to the database if it does not exist already
 * @param {string} genre 
 * @param {string} iconPath path to the genre art (optional)
 * @returns {number} index
 */
genre.define = async function(name){
  let index = await genre.exist(name);

  if (index === -1){
    let tuple = table.genre.tuple();
    tuple.data.name = name;

    index = await table.genre.insert(tuple);
  }

  return index;
}




var song = {};
/**
 * See if a song with the same values and relations already exists
 * @param {Tuple} tuple 
 */
song.exist = function(tuple){
  return new Promise((resolve, reject) => {
    table.song.forEach((i, row) => {
      if (
        tuple.data.path == row.data.path || (
        tuple.data.title == row.data.title &&
        tuple.data.length == row.data.length &&
        tuple.data.album == row.data.album &&
        tuple.data.track == row.data.track &&
        tuple.data.year == row.data.year &&
        tuple.data.artist1 == row.data.artist1 &&
        tuple.data.artist2 == row.data.artist2 &&
        tuple.data.artist3 == row.data.artist3 &&
        tuple.data.artist4 == row.data.artist4 &&
        tuple.data.artist5 == row.data.artist5 &&
        tuple.data.genre1 == row.data.genre1 &&
        tuple.data.genre2 == row.data.genre2 &&
        tuple.data.genre3 == row.data.genre3 &&
        tuple.data.genre4 == row.data.genre4 &&
        tuple.data.genre5 == row.data.genre5)
      ){
        resolve(i);
        return;
      }
    }, ()=>{
      resolve(-1);
    })
  })
};

/**
 * Add a new song to the database
 * @param {object} data 
 * @param {string} path 
 */
song.add = async function(data, path){
  if (!fs.existsSync(path)){
    throw new Error(`Invalid song file path (${path})`);
  }
  if (!data.title){
    throw new Error(`Invalid song name "${data.title}"`);
  }

  let tuple = table.song.tuple();
  tuple.data.title = data.title;
  tuple.data.path = path;
  tuple.data.year = parseInt(data.year || 0);
  tuple.data.track = parseInt(data.track || 0);
  tuple.data.length = parseInt((data.duration || 0)*1000); //ms to seconds
  tuple.data.album = await album.define(data.album);

  var artists = data.artist;
  if (artists[0]){
    tuple.data.artist1 = await artist.define(artists[0]);
  }
  if (artists[1]){
    tuple.data.artist2 = await artist.define(artists[1]);
  }
  if (artists[2]){
    tuple.data.artist3 = await artist.define(artists[2]);
  }
  if (artists[3]){
    tuple.data.artist4 = await artist.define(artists[3]);
  }
  if (artists[4]){
    tuple.data.artist5 = await artist.define(artists[4]);
  }
  if (artists.length > 5){
    console.warn(`Song has too many artists (${artists.length}) "${path}"`);
  }

  var genres = data.genre;
  if (genres[0]){
    tuple.data.genre1 = await genre.define(genres[0]);
  }
  if (genres[1]){
    tuple.data.genre2 = await genre.define(genres[1]);
  }
  if (genres[2]){
    tuple.data.genre3 = await genre.define(genres[2]);
  }
  if (genres[3]){
    tuple.data.genre4 = await genre.define(genres[3]);
  }
  if (genres[4]){
    tuple.data.genre5 = await genre.define(genres[4]);
  }
  if (genres.length > 5){
    console.warn(`Song has too many genres (${genres.length}) "${path}"`);
  }

  let index = await song.exist(tuple);
  if (index != -1){
    return index;
  }

  return await table.song.insert(tuple);
}
/**
 * Returns songs with completed relationships
 * @param {number[]} songs 
 */
song.get = async function(songs){
  if (!Array.isArray(songs)){
    throw new Error(`Invalid song get "${songs}, should of been an array"`);
  }

  let artists = [];
  let albums = [];
  let genres = [];
  let res = [];
  let tuple;
  let i = 0;

  //Get song data with references
  for (let id of songs){
    try{
      tuple = await table.song.get(id);
    }catch(e){
      res.push(null);
      continue;
    }

    i = res.length;
    res.push({
      title:    tuple.data.title,
      path:     tuple.data.path,
      duration: tuple.data.length/1000,
      album:    tuple.data.album,
      albumID:  tuple.data.album,
      track:    tuple.data.track,
      year:     tuple.data.year,
      artist:   [],
      genre:    []
    });

    //Add valid artists
    if (tuple.data.genre1){
      res[i].genre.push(tuple.data.genre1);
    }
    if (tuple.data.genre2){
      res[i].genre.push(tuple.data.genre2);
    }
    if (tuple.data.genre3){
      res[i].genre.push(tuple.data.genre3);
    }
    if (tuple.data.genre4){
      res[i].genre.push(tuple.data.genre4);
    }
    if (tuple.data.genre5){
      res[i].genre.push(tuple.data.genre5);
    }

    //Add valid genres
    if (tuple.data.artist1){
      res[i].artist.push(tuple.data.artist1);
    }
    if (tuple.data.artist2){
      res[i].artist.push(tuple.data.artist2);
    }
    if (tuple.data.artist3){
      res[i].artist.push(tuple.data.artist3);
    }
    if (tuple.data.artist4){
      res[i].artist.push(tuple.data.artist4);
    }
    if (tuple.data.artist5){
      res[i].artist.push(tuple.data.artist5);
    }

    //Add to list for reference completion
    if (albums.indexOf(res[i].album) == -1){
      albums.push(res[i].album);
    }
    for (let id of res[i].artist){
      if (artists.indexOf(id) == -1){
        artists.push(id);
      }
    }
    for (let id of res[i].genre){
      if (genres.indexOf(id) == -1){
        genres.push(id);
      }
    }
  }

  //Complete album references
  for (let id of albums){
    let name = `Missing Album "${id}"`;
    
    try{
      tuple = await table.album.get(id);
      name = tuple.data.name;
    }catch(e){}

    for (let song of res){
      if (song.album == id){
        song.album = name
      }
    }
  }

  //Complete artist references
  for (let id of artists){
    let name = `Missing Artist "${id}"`;

    try{
      tuple = await table.artist.get(id);
      name = tuple.data.name;
    }catch(e){}

    for (let song of res){
      let i = song.artist.indexOf(parseInt(id));

      if (i != -1){
        song.artist[i] = name;
      }
    }
  }

  //Complete genre references
  for (let id of genres){
    let name = `Missing genre "${id}"`;

    try {
      tuple = await table.genre.get(id);
      name = tuple.data.name;
    }catch(e){}

    for (let song of res){
      let i = song.genre.indexOf(id);

      if (i != -1){
        song.genre[i] = name;
      }
    }
  }

  return res;
}
/**
 * Finds songs with bad paths and deletes them
 */
song.scan = function(){
  return new Promise((resolve, reject)=>{
    table.song.forEach((index, tuple)=>{
      if (tuple.blank){
        return;
      }

      fs.exists(tuple.data.path, (exist)=>{
        if (exist){
          return;
        }

        //Since the file doesn't acutally exist, delete the row
        tuple.erase();
        table.song.overwrite(index, tuple);
      })
    }, ()=>{
      resolve();
      return;
    })
  })
}




async function initialize(){
  //Search for empty rows in the database
  await table.artist.scan();
  await table.genre.scan();
  await table.album.scan();
  await table.song.scan();

  //Scan for songs with bad paths
  await song.scan();

  return true;
}




/*------------------------------------------
    Out put api handles
------------------------------------------*/
module.exports = {
  album,
  artist,
  genre,
  song,
  initialize,
  table: table
}