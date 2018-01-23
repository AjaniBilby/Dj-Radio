let Throttle = require('throttle');
let lame = require('lame');
let fs = require('fs');

let library = {};
let queue = [];

let metaData = [];

let liveStream = new Throttle(16384); //128*1024/8 (Bytes Per Second)

let encoder = new lame.Encoder({
  //input
  channels: 2,
  bitDepth: 16,
  sampleRate: 44100,

  //output
  bitRate: 129,
  outputSampleRate: 22050,
  mode: lame.STEREO
});
encoder.on('data', function(chunk){
  liveStream.write(chunk);
});





async function Next(songData){
  metaData.unshift(songData);
  metaData.splice(11);

  let decoder = new lame.Decoder();
  decoder.on('data', function(chunk){
    encoder.write(chunk);
  });
  let stream = fs.createReadStream(songData.path);
  stream.on('data', function(chunk){
    decoder.write(chunk);
  });

  setTimeout(()=>{
    Next(queue.splice(0)[0]);
  },songData.duration*1000);

  if (queue.length == 0){
    queue.push(await module.exports.pick());
  }
}



setTimeout(async ()=>{
  console.log(queue);
  module.exports.pick()
    .then((song)=>{
      Next(song);
    })
    .catch((e)=>{
      console.error(e);
    })
}, 1000)



module.exports = {
  queue,
  library,
  history: metaData,
  stream: liveStream
};