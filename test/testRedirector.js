var nre    = require( '../nodify-redirector' );
var assert = require( 'assert' );

function mock_dao( ) {
  this.items = {
    'sl8.us': {
      'AAAAAA': 'http://example.com/whatever.html',
      'AAAAAB': 'http://example.com/dingos.html',
      'AAAABA': 'http://example.com/lancet.html',
      'AAAGAB': 'http://example.com/jama.html',
      'ILIKELARB': 'http://example.com/durian.html',
    },
    'sl8.us:8080': {
      'AAAAAA': 'http://example.org/overthere.html',
      'AAAAAB': 'http://example.com/dingos.html',
      'GONK': 'http://example.org/lancet.html',
      'ELEVEN': 'http://example.org/jama.html',
      'SNARK': 'http://example.org/durian.html',
    },
    'x.com': { 
      '9LEVEN': 'http://example.net/jama.html',
      'S7ARK': 'http://example.net/durian.html',
   }
  };
}

mock_dao.prototype.urlReadByHostShortcode = function( params, complete ) {
  var host = params[0];
  var shortcode = params[1];
  try {
    var data = {
      host: host,
      shortcode: shortcode,
      url: this.items[ host ][ shortcode ]
    };
  } catch( e ) {
    return complete( e, [] );
  }

  return complete( null, [ data ] );
};

var redirector_options = {
  dao: new mock_dao()
};

var redirector = new nre( redirector_options );

redirector.initRedirector( function( err, _f ) {

  function test_redirect ( host, shortcode, url, error, redirect_error ) {
    var location_header;
    var response_status;
    var next_err;
    var wrote_end = false;

    var request = {
      headers: {
        host: host
      },
      url: '/' + shortcode
    };

    var response = {
      writeHead: function( s, h ) {
        location_header = h.Location;
        response_status = s;
      },
      end: function ( ) {
        wrote_end = true;
      }
    };

    var next = function ( err ) {
      next_err = err;
    };

    _f( request, response, next );

    if( error ) {
      assert.notEqual( next_err, null, 'was expecting an error' );
    } else {
      assert.equal( response_status, 307, 'was expecting 307 status' );
      if( redirect_error ) {
        assert.notEqual( location_header, url, 'was expecting bad redirect' );
      } else {
        assert.equal( location_header, url, 'was expecting to be redirected' );
      }
    }
  }

  if( ! err ) {
    test_redirect( 'sl8.us', 'AAAAAA', 'http://example.com/whatever.html' );
    test_redirect( 'sl8.us', 'AAAAAB', 'http://example.com/dingos.html' );
    test_redirect( 'sl8.us', 'AAAABA', 'http://example.com/lancet.html' );
    test_redirect( 'sl8.us', 'AAAGAB', 'http://example.com/jama.html' );
    test_redirect( 'sl8.us', 'ILIKELARB', 'http://example.com/durian.html' );
    test_redirect( 'sl8.us:8080', 'AAAAAA', 'http://example.org/overthere.html' );
    test_redirect( 'sl8.us:8080', 'AAAAAB', 'http://example.com/dingos.html' );
    test_redirect( 'sl8.us:8080', 'GONK', 'http://example.org/lancet.html' );
    test_redirect( 'sl8.us:8080', 'ELEVEN', 'http://example.org/jama.html' );
    test_redirect( 'sl8.us:8080', 'SNARK', 'http://example.org/durian.html' );
    test_redirect( 'x.com', '9LEVEN', 'http://example.net/jama.html' );
    test_redirect( 'x.com', 'S7ARK', 'http://example.net/durian.html' );
    test_redirect( 'blargh.com', 'S7ARK', 'http://example.net/durian.html', true );
    test_redirect( 'x.com', 'TEST', 'http://example.net/durian.html', true );
    test_redirect( 'x.com', 'S7ARK', 'http://example.net/erewhon.html', false, true );
  }
} );