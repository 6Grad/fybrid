(function (exports, global) {

  //The following properties will be set dynamically
  //[id, locale]

  //do not rename fb   
  var fb = exports;

  fb.emitter = {};

  //api
  fb.on = function (eventName, fn) {
    $(fb.emitter).on(eventName, fn);
  };

  fb.emit = function (eventName) {
    $(fb.emitter).trigger(eventName);
  };

  //called when loaded.
  fb.init = function () {

    if (!global.$) {
      throw new Error('jQuery required');
    }

    var l = global.location;
    if (!fb.locale) fb.locale = 'de_DE';
    
    //called by fb js sdk when loaded 
    global.fbAsyncInit = function () {
      fb.emit('load');

      global.FB.init({
        appId      : fb.id, // App ID
        channelUrl : '//'+ l.host +'/channel', // Channel File
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : false  // parse XFBML
      });

      fb.emit('init');

      global.FB.getLoginStatus(function (res) {
        console.log('got FB lobinstatus: ', res);
        fb.emit('auth');      
      });
    };
    // Load the SDK Asynchronously
    (function (d) {
      var js, id = 'facebook-jssdk'; if (d.getElementById(id)) {return;}
      js = d.createElement('script'); js.id = id; js.async = true;
      js.src = "//connect.facebook.net/" + fb.locale + "/all.js";
      d.getElementsByTagName('head')[0].appendChild(js);
    })(global.document);
    
  };

})('object' === typeof module ? module.exports : (this.fb = {}), this);
