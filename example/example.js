var persist = require( 'nodify-mysql' );
var nre     = require( '../nodify-redirector' );
var props   = require( 'node-props' );
var express = require( 'express' );
var mug     = require( 'node-mug' );
var fs      = require( 'fs' );

var g;
var u;
var app;
var redirector_function;

var _aopts = {
  flags: "a+",
  encoding: "UTF-8",
  mode: 0666
};

read_props();

function read_props( ) {
  props.read( function( properties ) {
    g = properties;
    mug_init();
  } );
}

function mug_init( ) {
  var mug_options = g.mug || {version: mug.RANDOM};
  mug.createInstance( mug_options, function( generator ) {
    u = generator;
    dao_init();
  } );
}

function dao_init( ) {
  if( g.mysql ) {
    g.mysql.uuid = u;
    (new persist( g.mysql )).init( function ( err, object ) {
      if( err ) {
        exuent_omnis( 2 );
      } else {
        dao = object;
        init_redirector();
      }
    } );
  }
}

function init_redirector() {
  var redirector = new nre( { dao: dao } );
  redirector.initRedirector( function( err, _f ) {
    if( err ) {
      exuent_omnis( 3 );
    } else {
      redirector_function = _f;
      load_app();
    }
  } );
}

function load_app () {
  app = express();

  if( g.favicon ) {
    app.use( express.favicon( g.favicon.path ) );
  }

  if( g.access ) {
    if( g.access.path ) {
      g.access.stream = fs.createWriteStream( g.access.path, _aopts );
    }
    app.use( express.logger( g.access ) );
  }

  if( g.static && g.static.path ) {
    app.use( express.static( g.static.path, g.static ) );
  }

  app.use( redirector_function );

  if( g.router ) {
    app.use( app.router );
  }

  if( g.views ) {
    g.views.path && app.set( 'views', g.views.path );
    g.views.engine && app.set( 'view engine', g.views.engine );
  }
  
   app.use( function( err, req, res, next ) {
     console.log( "a: " + err );
    var e = ( 'number' == typeof err ) ? err : err.status;
    var path = 'http://' + req.headers.host + req.url;

    if( 404 == e ) {
      console.log( 'rendering 404' );
      res.status( 404 );
      res.render( '_404', {site: g.info, path: path } );
    } else {
      res.status( 500 );
      res.render( '_500', {site: g.info, path: path, desc: err.stack } );
    }
  } );

/*  app.use( express.errorHandler ); */

  if( g.listen && g.listen.port ) {
    app.listen( g.listen.port, g.listen.host );
  }
}