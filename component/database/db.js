var dbClass = require('./classes.js');

var tables = {}

tables.song = new dbClass('song', './data/song.db');
//Song ID is not needed since it will just be the row
tables.song.addField('title', 'string', 60);
tables.song.addField('path', 'string', 120);
tables.song.addField('length', 'int');       //Length of the song in ms
tables.song.addField('album', 'int');        //Each album will have a unique ID
tables.song.addField('artist1', 'int', 3);      //Each artist has a unique ID, maximum five artists per song
tables.song.addField('artist2', 'int', 3);
tables.song.addField('artist3', 'int', 3);
tables.song.addField('artist4', 'int', 3);
tables.song.addField('artist5', 'int', 3);
tables.song.addField('genre1', 'int', 2);    //Each genre has a unique ID, maximum five genres per song
tables.song.addField('genre2', 'int', 2);    //NOTE: geners have a smaller ID number because there are less of them (65536)
tables.song.addField('genre3', 'int', 2);
tables.song.addField('genre4', 'int', 2);
tables.song.addField('genre5', 'int', 2);


tables.song.scan().then(async () => {
  console.log('rows', tables.song.rows);

  for (let i=0; i<=tables.song.rows; i++){
    row = await tables.song.get(i);
    console.log(row.data);
  }
});