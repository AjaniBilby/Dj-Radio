var library = require('./component/library.js');











// var app = require('passer');


// /*
//   HTTP / XML requests
// */

// app.publicFolder = "public";
// app.listen(8080);

// app.addAuth(
//   ["/dj/*"],
//   function(req, res){
//     return req.session.loggedIn;
//   },
//   function(req, res){
//     res.writeHead(302, {
//       'Location': 'http://'+req.headers.host+'/dj/login'
//     });
//     res.end("redirecting");

//     return;
//   },
//   ['/dj/login*']
// );