var lame = require('lame');
var fs =  require('fs');
var Throttle = require('throttle');
var id3 = require('id3-writer');

var Stream = require('./stream.js');
var player = require('./player.js');

// var id3Meta = 'ID3    gvTIT2   M  ÿþT o p   o f   t h e   W o r l d   [ M o n s t e r c a t   R e l e a s e ] TPE1   9  ÿþ[ E l e c t r o ]   -   S t e p h e n   W a l k i n g TALB   9  ÿþ[ E l e c t r o ]   -   S t e p h e n   W a l k i n g TPE2   9  ÿþ[ E l e c t r o ]   -   S t e p h e n   W a l k i n g COMM   >  eng  ÿþh t t p : / / w w w . L a t a a Y o u T u b e . c o m APIC  0—   image/jpeg cover ÿØÿà JFIF  H H  ÿÛ C \n\n';
//
// id3Meta = `���
// ����%�?��gyO��������P�L����o�nq�A1�z^�w^��.r2WKXͦ��<����5��#,��J�L��u���t����_eŗ*-�i�4���չ��x@��p�e��? EV���B2lw�����(��n��t������Sy�5�&p?��G#,�&��������k	����2�!�v:V��9o�gEM*
// ��	K�G�O�P��,wY�`+'`'+`��EAS�����P�a�?��Y�;�*w���WM&l�`;

var id3Meta = new id3.Meta({
  title: "Dj-Radio",
  artist: "Ajani James Bilby"
});
console.log(id3Meta);

var listeners = new Stream();
listeners.num = 0;
listeners.gain = function(){
  listeners.num += 1;
  listeners.write(listeners.num);
};
listeners.lose = function(){
  listeners.num -= 1;
  listeners.write(listeners.num);
};
player.listeners = listeners;





function BottleNeck(){
  live.bottleNeck = new Throttle(16000); // 128000/8
  live.bottleNeck.on('data', function(chunk){
    live.stream.write(chunk);
  });

  return live.BottleNeck;
}

var live = {
  buffer: [],
  stream: new Stream(),
  shrinkBuffer: function(){
    if (live.buffer.length > live.bufferLength){
      live.buffer.splice(0, live.buffer.length-(live.bufferLength-1));
    }
  },
  bufferLength: 30,
  bottleNeck: null
};
new BottleNeck();

live.stream.on('data', function(chunk){
  live.buffer.push(chunk);
  live.shrinkBuffer();
});

var encoder = new lame.Encoder({
  //input
  channels: 2,
  bitDepth: 16,
  sampleRate: 44100,

  //output
  bitRate: 128,
  outputSampleRate: 22050,
  mode: lame.STEREO
});
encoder.on('data', function(chunk){
  if (!live.bottleNeck){
    //If the BottleNeck is missing create one
    new BottleNeck();
  }
  live.bottleNeck.write(chunk);
});


player.stream.on('data', function(chunk){
  encoder.write(chunk);
});





module.exports = {
  pass: function(req, res){
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg3',
      'Transfer-Encoding': 'chuncked'
    });

    for (let chunk of live.buffer){
      res.write(chunk);
    }

    var stream = live.stream.on('data', function(chunk){
      res.write(chunk);
    });

    listeners.gain();

    req.connection.on('close', function(){
      listeners.lose();
      live.stream.remove('data', stream);
    });
  },
  player: player,
  listeners: listeners
};


setInterval(function () {
  console.log('push meta');
  live.stream.write(id3Meta);
}, 3000);
