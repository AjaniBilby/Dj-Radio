const EventEmitter = require('events');

class Throttle extends EventEmitter{
  constructor(bytesPerSecond){
    super();

    this.chunkSize = Math.floor(bytesPerSecond);
    this.buffer = new Buffer('');

    this.timer = setInterval((self)=>{
      self.loop();
    }, 1000, this);
  }

  loop(){
    let chunk = this.buffer.slice(0, this.chunkSize);
    this.emit('data', chunk);

    this.buffer = this.buffer.slice(this.chunkSize);
  }

  write(chunk){
    this.buffer = Buffer.concat([this.buffer, chunk]);
  }

  flush(){
    this.buffer = new Buffer('');
  }
}


module.exports = Throttle;