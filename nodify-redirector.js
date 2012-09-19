( function ( ) {
  var fs  = require( 'fs' );
  var url = require( 'url' );

  function nodify_redirector ( o ) {
    this.dao = o.dao;
  }

  nodify_redirector.prototype.initRedirector = function ( complete ) {
    var that = this;

    var rf = function( request, response, next ) {
      var params = [
        request.headers.host,
        url.parse( request.url ).pathname.substring(1)
      ];
      that.dao.urlReadByHostShortcode( params, function ( err, data ) {
        if( err ) {
          next( 500 );
        } else if( ( ! data ) || ( data.length < 1 ) || ( ! data[0].url ) ) {
          next( 404 );
        } else {
          response.writeHead( 307, { "Location": data[0].url } );
          response.end();
        }
      } );
    };
    complete( null, rf );
  };

  nodify_redirector.prototype.initAPI = function ( complete ) {
    complete( null, null );
  };

  if( module && module.exports ) {
    module.exports = nodify_redirector;
  }

} ) ( );