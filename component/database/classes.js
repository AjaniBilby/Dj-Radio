var Radix = require('custom-radix');
var cosf = require('cosf');
var fs = require('fs');








//Setup fixed radix sizes
str = '';
for (let i=0; i<=255; i++){
  str += String.fromCharCode(i);
}
byteRadix = new Radix(str);










class Attribute{
  constructor(parent){
    if (!(parent instanceof Table)){
      throw new Error(`Invalid attribute definition. Not supplied valid parent table`);
    }

    this.name = "";
    this.size = 0;
    this.type = 0;
    this.parent = parent;
  }
}
Attribute.prototype.encode = function(value){
  let badInput = false;

  switch (this.type){
    case this.types.int:
      if (Number.isInteger(value)){
        let working = true;
        let arr = [value];

        while (working){
          working = false;

          for (let i=0; i<arr.length; i++){
            if (arr[i] > 255){
              arr[i] -= 255;
              arr[i+1] = (arr[i+1] || 0) + 1;

              working = true;
            }
          }
        }

        if (arr.length > this.size){
          let bytes = arr.reverse();
          console.warn(`Attribute ${this.parent.name}/${this.name} has been given too big an int while will overflow. "${value}" [${bytes}]`);
          arr = arr.splice(0, this.size);
        }

        while (arr.length < this.size){
          arr.push(0);
        }

        return Buffer(arr.reverse());;
      }

      badInput = true;

    case this.types.string:
      if (typeof value == 'string'){   
        let buffer = new Buffer(value);

        //Remove any extra characters in the string
        if (value.length > this.size){
          console.warn(`Attribute ${this.parent.name}/${this.name} has been give a string that was too long.\n${value.length} > ${this.size}. "${value}"`);

          while (buffer.length > length){
            value = value.slice(0, value.length-1);
            buffer = new Buffer(value);
          }
        }
      
        //Add trailing spaces to make the string the right length
        if (buffer.length < this.size){
          let extra = '';
          let loop = this.size-buffer.length;

          for (let i=0; i<loop; i++){
            extra += ' ';
          }

          buffer = Buffer.concat([buffer, new Buffer(extra)]);
        }
      
        return buffer;
      }
      
      badInput = true;
    
    default:
      if (badInput){
        let type = Object.keys(this.types)[this.type];
        throw new Error(`Attribute ${this.parent.name}/${this.name} has been given a bad input (${value}), should of been ${type}`);
      }else{
        throw new Error(`Attribute ${this.parent.name}/${this.name} does not have a valid type`);
      }
  }
}
Attribute.prototype.decode = function(value){
  if (value.length != this.size){
    console.warn(`Attribute ${this.parent.name}/${this.name} is trying to decode a field of the wrong size.\nGiven ${value.length} expected ${this.size}`);
  }

  switch (this.type){
    case this.types.int:
      let int = 0;

      for (let i=0; i<value.length; i++){
        let exp = Math.pow(255, value.length-i-1);
        int += value[i]*exp;
      }
    
      return int;
    case this.types.string:

      value = value.toString();

      //Remove trailling white space
      while (value[value.length-1] == " "){
        value = value.slice(0, value.length-1);
      }

      return value;

    default:
      throw new Error(`Attribute ${this.parent.name}/${this.name} has an invalid type`);
  }
}
//All numbers are unsigned
Attribute.prototype.types = {
  int: 0,
  string: 1
}









class Tuple{
  /**
   * Parse an encoded table row to the tuple, with a reference to the table object it's self
   * @param {Table} parent 
   * @param {string} data (encoded)
   */
  constructor(parent, data){
    if (!(parent instanceof Table)){
      throw new Error(`Invalid Tuple definition. Not supplied valid parent table`);
    }

    this.parent = parent;
    this.index = 0;
    this.data = {};
    this.blank = true;

    if (!data || data.length == 0){
      this.erase(); //Make this tuple blank
    }else{
      this.decode(data);
    }
  }
}
/**
 * Decode the raw row data into an object
 * @param {string} data 
 */
Tuple.prototype.decode = function(data){
  this.blank = true;

  for (field of this.parent.fields){
    let attr = data.slice(0, field.size);
    data = data.slice(field.size);

    this.data[field.name] = field.decode(attr);

    //Check if the tuple is completely blank (end check if found a non blank value)
    if (this.blank && this.data[field.name] != '' && this.data[field.name] != 0){
      this.blank = false;
    }
  }

  return this;
}
/**
 * Encode the tuple data into raw row data
 */
Tuple.prototype.encode = function(){
  let attrs = [];

  for (field of this.parent.fields){
    let attr = field.encode(this.data[field.name]);
    if (attr.length != field.size){
      throw new Error(`Unknown encoding error. The attribute ${this.parent.name}/${field.name} has encoded to the wrong length.\n\rWas ${attr.length}, should of been ${field.size}`);
    }

    attrs.push(attr);
  }

  let data = Buffer.concat(attrs);

  if (data.length != this.parent.rowLength){
    throw new Error(`Unknown encoding error, The tuple's length is incorrect.\n\tWas ${data.length}, should of been ${this.parent.rowLength}`);
  }

  return data;
};
/**
 * Return all tuple values to default
 */
Tuple.prototype.erase = function(){
  for (field of this.parent.fields){
    if (field.type == 0){
      this.data[field.name] = 0;
    }else{
      this.data[field.name] = '';
    }
  }

  return this;
}










class Table{
  /**
   * Initilize the table making sure it knows where to store data, and it has a reference name for debugging
   * @param {string} name 
   * @param {string} filePath 
   */
  constructor(name, filePath){
    if (typeof name != "string" || name.length == 0){
      throw new Error(`Invalid init table name (${name}). All tables must have valid names for debugging`);
    }
    if (!fs.existsSync(filePath)){
      throw new Error(`Invalid table path ("${filePath}")`);
    }

    this.name = name;
    this.path = filePath;
    this.fields = [];
    this.rowLength = 0;
    this.rows = 0;

    this.empty = [];
  }
}
/**
 * 
 * @param {string} name 
 * @param {string} type 
 * @param {int} size (has generated default values)
 * @returns {void}
 */
Table.prototype.addField = function(name, type, size){
  if (typeof name != 'string' || name.length == 0){
    throw new Error(`Invalid init field name ${this.name}/${name}. All fields must have valid names for debugging`);
  }
  if (type != 'int' && type != 'string'){
    throw new Error(`Table ${this.name} is attempting to create field ${name} with an invalid type (${type})`);
  }

  if (isNaN(size)){
    switch(type){
      case 'int':
        size = 4;   // 32 bits
        break;
      case 'string':
        size = 256; //32 bytes
        break;
    }
  }

  let attr = new Attribute(this);
  attr.name = name;
  attr.type = type == 'int' ? 0 : 1;
  attr.size = size;

  this.fields.push(attr);

  this.rowLength = 0;
  for (field of this.fields){
    this.rowLength += field.size;
  }
};


/**
 * Returns a blank tuple to be used for setting later
 * @returns {Tuple}
 */
Table.prototype.tuple = function(data){
  //Create blank data for the tuple to use

  return new Tuple(this, data);
}

/**
 * Find empty rows
 * @returns {void}
 */
Table.prototype.scan = function(){
  this.empty = [];
  let db = this;

  //This cannot be a async function, since the scope will be incorrect for the return
  return new Promise((resolve, reject) => {
    db.forEach(function(index, tuple){
      if (tuple.blank){
        db.empty.push(index);
      }
    }, function(lastIndex){
      db.rows = lastIndex;
      resolve();
      return;
    });
  })
}



/**
 * Loop though all database rows running a callback for each
 * @param {function} loop(index, tuple) 
 * @param {function} finish(lastIndex, broken) 
 * @returns {void}
 */
Table.prototype.forEach = function(loop, finish){
  if (typeof loop != 'function'){
    throw new Error(`Invalid loop function given to table ${this.name}`);
  }

  let stream = fs.createReadStream(this.path, {
    highWaterMark: this.rowLength
  });
  let i = 0;
  let db = this;

  stream.on('data', function(row){
    if (row.length != db.rowLength){
      throw new Error(`${db.name} row ${i} is bad. ${row.length}-${db.rowLength}`);
    }

    let t = db.tuple(row);
    t.index = i;
    let res = loop(i, t);

    if (res === false){
      stream.close();

      if (typeof finish == "function"){
        finish(i);
      }
    }

    i++;
  });

  stream.on('end', function(){
    if (typeof finish == "function"){
      finish(i);
    }

    return;
  });
}



/**
 * Add a new row to the end of the table (saves processing, but will leave blank rows blank)
 * @param {Tuple} tuple 
 * @param {function} callback 
 * @returns {number} index
 */
Table.prototype.append = function(tuple){
  if (!(tuple instanceof Tuple) || tuple.parent != this){
    throw new Error(`Provided ${this.name} with an invalid Tuple`);
  }

  let chunk = tuple.encode();
  if (chunk.length != this.rowLength){
    throw new Error(`Critical Error\nTuple did not generate the correct length row.\nExpected ${this.rowLength} got ${chunk.length}`);
  }

  let index = this.rows;
  tuple.index = index;
  this.rows += 1;

  return new Promise((resolve, reject) => {
    fs.appendFile(this.path, chunk, function(err){
      if (err){
        reject(err);
        return;
      }else{
        resolve(index);
        return;
      }
    });
  })
}

/**
 * Get a specific row by index
 * @param {number} index
 * @returns {tuple}
 */
Table.prototype.get = function(index){

  let db = this;

  //This function cannot be async because other wise the return is in the wrong scope
  //Also this function cannot get the the tuple by direct byte picking, because of utf8 encoding meaning that some rows are actually longer that the row length
  return new Promise((resolve, reject) => {
    if (index > this.rows){
      reject('Index out of range')
      return;
    }

    let stream = fs.createReadStream(this.path, {
      start: index*this.rowLength,
      highWaterMark: this.rowLength
    });
    stream.on('data', function(row){
      if (row.length < this.rowLength){
        throw new Error(`${this.name} has had a bad read. ${row.length}-${this.rowLength}`);
      }

      let t = db.tuple(row);
      t.index = index;

      resolve(t);
      stream.close();
      return;
    })

    stream.on('end', function(){
      reject(`Index out of range (ran out of file) [${db.name}][${index}]`);
    })
  })
}

/**
 * Overwrite a specific rows data
 * @param {number} index 
 * @param {Tuple} tuple 
 * @returns {number} index
 */
Table.prototype.overwrite = function(index, tuple){
  if (!(tuple instanceof Tuple) || tuple.parent != this){
    throw new Error(`Parsing irrelevent tuple to ${this.name}`);
  }

  let chunk = tuple.encode();
  if (chunk.length != this.rowLength){
    throw new Error(`Critical Error\nTuple did not generate the correct length row.\nExpected ${this.rowLength} got ${chunk.length}`);
  }

  let stream = fs.createWriteStream(this.path, {
    flags: 'r+',
    mode: 0777,
    start: index*this.rowLength
  });
  tuple.index = index;

  return new Promise((resolve, reject) => {
    stream.write(chunk, () => {
      stream.close();
      resolve(index);
    });
  })
}

/**
 * Empty a specific row to be overwritten later
 * @param {number} index 
 * @returns {number} index
 */
Table.prototype.delete = async function(index){
  //Create a blank row
  var tuple = db.tuple();

  return await this.overwrite(index, tuple);
}

/**
 * Add the new tuple in an existing free space (i.e at the end of the table, or a blank row)
 * @param {Tuple} tuple 
 * @returns {number} index
 */
Table.prototype.insert = async function(tuple){
  let db = this;

  if (this.empty.length == 0){
    return await db.append(tuple);
  }

  let index = this.empty[0];
  tuple.index = index;
  this.empty = this.empty.slice(1);

  return await this.overwrite(index, tuple);
}




module.exports = Table;