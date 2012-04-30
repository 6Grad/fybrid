var SignedRequest = require('./facebook-signed-request');
var utils = require('./utils');
var util = require('util');

//shared code
var fb = require('./fb');

//These keys wont be available in the browser
var privateKeys = ['secret'];

// get the signed request
// TODO move
var getSr = function (req, fb, cb) {
  
  if (req.body && req.body.signed_request) {
    //encoded Signed Request
    var encSr = req.body.signed_request;    
    new SignedRequest(encSr,{secret: fb.secret}).parse(function (errors, sr) {
      if (sr.isValid()) {
        return cb(sr.data);
      }
    });
  } 
  return cb(null);
};

var getCode = function (obj) {
  var source = utils.toSource(obj, privateKeys);
  var code = "(function (global) { var fb = global.fb = " + source + "; fb.init();  } )(this);";
  //TODO uglify code
  return code;
};


//Public
var Fybrid = module.exports = function (options) {

  var options = options || { conf: './conf/fybrid.js'}
  , conf = require(options.conf);

  this.fb = fb;

  utils.merge(this.fb, conf);

  if (!this.fb.id || !this.fb.secret) throw new Error('Missing Configuration keys: "id", "secret"');

  console.log('Fybrid initialized with id: %s, secret: %s', this.fb.id, this.fb.secret);

  //prepare code
  this.fbCode = getCode(this.fb);

};

Fybrid.prototype.helper = function () {
  var that = this;
  return function (req, res) {
    if (req && req.session) {
      return req.session.fb ? req.session.fb : that.fb;
    } else {
      return that.fb;
    }
  };
};

Fybrid.prototype.mw = function () {

  var that = this;

  return function (req, res, next) {
    if ('undefined' === typeof req.session) {
      throw new Error('session support needed');
    }

    //this is not really async
    //TODO move this to different loaders ( this one would be SrLoader)
    getSr(req, that.fb, function (sr) {
      if (sr) {
        //expose sr to client js
        //TODO create a copy
        var fb = {};
        if ('undefined' !== typeof req.session.fb) {
          fb = req.session.fb;
        } else {
          utils.merge(fb, that.fb);
        }

        if (sr.page) fb.page = sr.page;
        if (sr.user_id) fb.userId = sr.user_id;
        if (sr.user) {
          fb.user = sr.user;
          fb.locale = sr.user.locale;
        }

        //this one is user specific. therefore store it in session.
        req.session.fb = fb;
        req.session.fbCode = getCode(fb);
      }
    });

    if ( req.url === '/fybrid.js') {
      //client part requested

      //prefer customized code.
      var code = req.session.fbCode ? req.session.fbCode : that.fbCode;

      var js = {
        headers: {
          'Content-Type': 'text/javascript'
            , 'Content-Length': code.length
        },
        body: code
      };

      res.writeHead(200, js.headers);
      res.end(js.body);

    } else {
      //expose to req
      req.fb = req.session.fb ? req.session.fb : that.fb;
      next();  
    }

  };
};
