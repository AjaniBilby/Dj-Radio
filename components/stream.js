class Stream{
  constructor(){
    this.cache = {
      on: {
        data: []
      }
    };
  }
}

Stream.prototype.write = function(chunk, type='data'){
  for (let listener of this.cache.on[type]){
    if (typeof(listener) == 'function'){
      //Make sure it isn't a empty item due too deletion
      listener(chunk);
    }
  }
};

Stream.prototype.on = function(type, listener){
  if (typeof(listener) == 'function'){
    if (typeof(this.cache.on[type]) != 'object'){
      this.cache.on[type] = [];
    }

    this.cache.on[type].push(listener);
    return this.cache.on[type][this.cache.on[type].length-1];
  }else{
    return false;
  }
};

Stream.prototype.remove = function(type, item){
  if (this.cache.on[type]){
    var index = this.cache.on[type].indexOf(item);
    if (index != -1){
      delete this.cache.on[type][index];
      return true
    }else{
      return null;
    }
  }
  return false;
};

module.exports = Stream;
