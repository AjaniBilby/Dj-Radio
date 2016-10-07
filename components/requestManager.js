var random = require("mass-random");
var fs = require("fs");
var object = require("object-manipulation");

var sessions = {
  ids: {},
  keyLength: 20,
  count: 0,
  usedIDs: []
};

var handlers = {
  functions: {
    get: [],
    post: []
  },
  list: {
    get: [],
    post: []
  }
};

function pathTester(path, loc){
  var valid = false;
  if (path.indexOf("*") != -1){
    path = path.split("*");
    var searchPoint = 0;
    //Loop for each section of the path
    for (var i=0; i<path.length; i++){
      //Next if the last section matchs from previous to the end of the location
      var index;
      if (i == path.length-1){
        if (path[i] === ""){
          break;
        }
        index = loc.indexOf(path[i]);
        valid = (valid && path[i] == loc.slice(index));
        break;
      }

      //Check if the next sections matchs
      index = loc.indexOf(path[i]);
      if (index >= searchPoint){
        searchPoint = index + path[i].length;
      }else{
        valid = false;
        break;
      }
    }
  }else{
    //If there are no special characters, then test if the strings are EXACTLY the same
    valid = (path == loc);
  }
  return valid;
}


function MakeSession(ip){
  var id=null;
  //Check if there is no possible id numbers to use in current set, if so expand set length
  if (sessions.count+1 >= sessions.keyLength*30){
    console.log("***Error***: ran out of unique id numbers, expanding key length");
    sessions.keyLength += 5;
  }

  //Get new unique ID
  while (id === null || typeof(sessions.usedIDs[id]) === "string"){
    id = random.string(sessions.keyLength);
  }

  //Create new unique ID
  sessions.ids[id] = {};
  sessions.ids[id].ip = ip.toString();
  sessions.ids[id].data = {};
  sessions.ids[id].index = sessions.usedIDs.length;
  sessions.usedIDs.push(id);

  //Setup timeout
  setTimeout(function () {
    sessions.usedIDs.splice(sessions.ids[id].index, sessions.ids[id].index+1);
    sessions.ids[id] = undefined;
  }, module.exports.sessionTimeout*3600000);

  sessions.count += 1;

  return id;
}

module.exports = {
  sessionFreeZones: [],
  sessionTimeout: 3,
  publicFolder: null,
  documentTypes: {
    "aac": "audio/aac",
    "aifc": "audio/aiff",
    "aiff": "audio/aiff",
    "au": "audio/basic",
    "snd": "audio/basic",
    "mid": "audio/mid",
    "midi": "audio/mid",
    "rmi": "audio/mid",
    "m4a": "mp4",
    "mp3": "mpeg",
    "oga": "audio/ogg",
    "spx": "adt",
    "adt": "audio/vnd.dlna.adts",
    "wav": "audio/wav",
    "aif": "audio/x-aiff",
    "m3u": "audio/x-mpegurl",
    "wax": "audio/x-ms-wax",
    "wma": "audio/xms-wma",
    "ra": "audio/x-pn-realaudio",
    "ram": "audio/x-pn-realaudio",
    "rpm": "audio/x-pn-realaudio-plugin",
    "smd": "audio/x-smd",
    "smx": "audio/x-smd",
    "smz": "audio/x-smd",
    "odf": "font/odf",
    "woff": "font/x-woff",
    "gif": "image/gif",
    "ief": "image/ief",
    "jpe": "image/jpeg",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "jfif": "image/pjipeg",
    "png": "image/png",
    "pnz": "image/png",
    "svg": "image/svg+xml",
    "svgz": "image/svg+xml",
    "tif": "image/tiff",
    "tiff": "image/tiff",
    "rf": "image/vnd.rn-realflash",
    "wbmp": "image/vnd.wap.wbmp",
    "ras": "image/x-cmu-raster",
    "cmx": "image/x-cmu",
    "ico": "image/ico",
    "art": "image/x-jg",
    "pnm": "image/x-portable-anymap",
    "pbm": "image/x-portable-bitmap",
    "rgb": "image/x-rgb",
    "xbm": "image/x-xbitmap",
    "xpm": "image/x-xpixmap",
    "xwd": "image/x-xwindowdump",
    "eml": "message/rfc822",
    "mht": "message/rfc822",
    "mhtml": "message/rfc822",
    "nws": "message/rfc822",
    "appcache": "text/cache-manifest",
    "ics": "text/calendar",
    "css": "text/css",
    "less": "text/css",
    "dlm": "text/dlm",
    "323": "text/h323",
    "htm": "text/html",
    "html": "text/html",
    "hxt": "text/html",
    "uls": "text/iuls",
    "jsx": "text/jscript",
    "asm": "text/plain",
    "bas": "text/plain",
    "c": "text/plain",
    "cnf": "text/plain",
    "cpp": "text/plain",
    "h": "text/plain",
    "map": "text/plain",
    "txt": "text/plain",
    "vcs": "text/plain",
    "xdr": "text/plain",
    "rtx": "text/rich",
    "sct": "text/scriptlet",
    "sgml": "text/sgml",
    "tsv": "text/tab-separated-values",
    "vbs": "text/vbscript",
    "wml": "text/vnd.wrap.wml",
    "wmls": "text/vnd.wap.wmlscript",
    "htt": "text/webviewhtml",
    "htc": "text/x-component",
    "hdml": "text/x-hdml",
    "disco": "text/xml",
    "dll.config": "text/xml",
    "dtd": "text/xml",
    "exe.config": "text/xml",
    "mno": "text/xml",
    "vml": "text/xml",
    'wsdl': 'text/xml',
    'xml': 'text/xml',
    'xsd': 'text/xml',
    "xsf": 'text/xml',
    'xsl': 'text/xml',
    'xslt': 'text/xml',
    'odc': 'text/x-ms-doc',
    'etx': 'text/x-setext',
    'vcf': 'text/x-vcard',
    '3gp': 'video/3gpp',
    '3gpp': 'video/3gpp',
    '3g2': 'video/3gpp2',
    '3gp2': 'video/3gpp2',
    'avi': 'video/avi',
    'm4v': 'video/mp4',
    'mp4v': 'video/mpeg',
    'm1v': 'video/mpeg',
    'mp2': 'video/mpeg',
    'mpa': 'video/mpeg',
    'mpeg': 'video/mpeg',
    'mpg': 'video/mpeg',
    'mpv2': 'video/mpeg',
    'ogg': 'video/ogg',
    'ogv': 'video/ogg',
    'mov': 'video/quicktime',
    'qt': 'video/quicktime',
    'm2ts': 'video/vnd.dlna.mpeg-tts',
    'ts': 'video/vnd.dlna.mpeg-tts',
    'tts': 'video/vnd.dlna.mpeg-tts',
    'webm': 'video/webm',
    'flv': 'video/x-flv',
    'ivf': 'video/x-ivf',
    'lsf': 'video/x-la-asf',
    'lsx': 'video/x-la-asf',
    'asf': 'video/x-ms-asf',
    'asr': 'video/x-ms-asf',
    'asx': 'video/x-ms-asf',
    'nsc': 'video/x-ms-asf',
    'dvr-ms': 'video/x-ms-dvr',
    'wm': 'video/x-ms-wm',
    'wmv': 'video/x-ms-wmv',
    'wmx': 'video/x-ms-wmx',
    'wtv': 'video/x-ms-wtv',
    'wvx': 'video/x-ms-wvx',
    'movie': 'video/x-sgi-movie',
    'flr': 'x-world/x-vrml',
    'wrl': 'x-world/x-vrml',
    'wrz': 'x-world/x-vrml',
    'xaf': 'x-world/x-vrml',
    'xof': 'x-world/x-vrml'
  },
  makeSession: function(ip){
    return MakeSession(ip);
  },
  getCookies: function(request){
    var cookies = {};
    if (request.headers === undefined){
      return cookies;
    }
    if (request.headers.cookie === undefined){
      return cookies;
    }
    var parts = request.headers.cookie.split(';');
    for (i=0; i<parts.length; i++){
      var sections = parts[i].split("=");
      var name = sections[0];
      while(name[0] == " "){
        name = name.slice(1);
      }
      var value = sections.splice(1);
      cookies[name] = value[0];
    }
    return cookies;
  },
  getQueries: function(queryString){
    queryString = queryString.toString();
    var query = {};

    //get each argument
    if (queryString.indexOf("&") != -1){
      queryString = queryString.split("&");
    }else{
      queryString = [queryString];
    }

    for (var i=0; i<queryString.length; i++){
      if (queryString[i].indexOf("=") != -1){
        queryString[i] = queryString[i].split("=");
        query[queryString[i][0]] = queryString[i][1];
      }else{
        query[queryString[i]] = true;
      }
    }

    return query;
  },
  getSession: function(id, ip){
    output = {valid: false, existent: false, err: null, data: null};

    //check for valid inputs
    if (typeof(id) != "string"){
      output.err = "invalid Session string";
      return output;
    }
    if (typeof(ip) != "string"){
      output.err = "invalid IP value";
      return output;
    }
    id = id.toString();
    ip = ip.toString();

    //check values
    if (sessions.usedIDs.indexOf(id) != -1){
      output.existent = true;
      if (sessions.ids[id].ip == ip){
        output.correctIP = true;
        output.valid = true;
        output.data = sessions.ids[id].data;
        return output;
      }else{
        output.err = "In correct IP";
        return output;
      }
    }else{
      output.err = "Session data exists, without index";
      return output;
    }
    output.err = "Unknown server error";
    return output;
  },
  server: function(req, res){
    req.cookies = module.exports.getCookies(req);
    //get query
    if (req.url.indexOf("?") != -1){
      req.query = module.exports.getQueries(req.url.split("?")[1]);
    }else{
      req.query = {};
    }

    //Get extention
    page = req.url.split("?")[0].toLowerCase();
    if (page == "/"){
      page="/index";
    }
    var page = page.split('/');
    if (page[page.length-1].indexOf(".") == -1){
      page[page.length-1] += ".html";
    }
    page = page.join("/");
    page = "./"+module.exports.publicFolder+page;
    var extention = page.split(".")[2];
    req.extention = extention;

    var valid = false;

    if (module.exports.sessionFreeZones.indexOf(req.url.split("?")[0]) != -1){
      //Get Session
      req.session = {};
      req.session.id = req.cookies.session;
      req.session.data = {
        loggedIn: false
      };
      res.sendStatus = function(id){
        res.writeHead(id, {});
        res.end(id.toString());
        return;
      };

      //Test valid?
      valid = false;
      if (typeof(req.session.id) == "string"){
        if (module.exports.getSession(req.session.id, req.connection.remoteAddress).valid){
          valid = true;
          req.session.data = sessions.ids[req.session.id].data;
          req.session.set = function(newData){
            if (typeof(newData) != "object"){
              return false;
            }else{
              sessions.ids[req.session.id].data = object.merg(sessions.ids[req.session.id].data, newData);
              return true;
            }
          };
        }
      }

      //If not valid send valid ID
      if (!valid){
        res.writeHead(302, {
          'Location': 'http://'+req.headers.host+req.url,
          "Set-Cookie": "session="+MakeSession(req.connection.remoteAddress)+";path=/"
        });
        res.end("redirecting");
        return;
      }
    }else{
      valid = true;
    }

    //Has valid ID
    if (valid === true){
      if (req.method == "GET"){
        var url = req.url.split("?")[0].toLowerCase();
        for (var i=0; i<handlers.list.get.length; i++){
          if (pathTester(handlers.list.get[i].split("?")[0], url)){
            req.body = '';
            req.on('data', function (data) {
              req.body += data;
            });
            req.on('end', function () {
              req.body = module.exports.getQueries(req.body)
              handlers.functions.get[i](req, res);
            });
            return;
          }
        }
      }else if (req.method == "POST"){
        var url = req.url.split("?")[0].toLowerCase();
        for (var i=0; i<handlers.list.post.length; i++){
          if (pathTester(handlers.list.post[i].split("?")[0], url)){
            req.body = '';
            req.on('data', function (data) {
              req.body += data;
            });
            req.on('end', function () {
              req.body = module.exports.getQueries(req.body);
              handlers.functions.post[i](req, res);
            });
            return;
          }
        }
      }
      //If there is no handler on the path, try and find a associated file
      if (module.exports.publicFolder !== null){
        //Does file exist
        fs.access(page, fs.R_OK | fs.W_OK, function(err){
          if (err !== null){
            //Error 404
            res.writeHead(404);
            res.end("Cannot find "+req.url);
            return;
          }else{
            if (extention != "html"){
              //Make an array of image and video types, then check what type of data you are sending, and then tell the header what type of data to receive
              res.writeHead(200, {'Content-Type': module.exports.documentTypes[extention] });
            }else{
              module.exports.sendHeader(req, res);
            }
            //Send file
            res.end(fs.readFileSync(page));
            return;
          }
        });
      }
    }
  },
  get: function(path, callback){
    path = path.toLowerCase();
    var index = handlers.list.get.length;
    handlers.list.get[index] = path;
    handlers.functions.get[index] = callback;
  },
  post: function(path, callback){
    path = path.toLowerCase();
    var index = handlers.list.post.length;
    handlers.list.post[index] = path;
    handlers.functions.post[index] = callback;
  },
  sendHeader: function(req, res){
    if (req.query.noHeader !== true){
      if (module.exports.publicFolder !== null && typeof(module.exports.publicFolder) == "string"){
        //Using sync to make sure that the file gets sent NOW so that it doesn't end up ever getting sent after a res.end();
        if (fs.readdirSync(module.exports.publicFolder).indexOf("header.html") != -1){
          res.write( fs.readFileSync('./'+module.exports.publicFolder+'/header.html').toString() );
        }
      }
    }
  }
};
