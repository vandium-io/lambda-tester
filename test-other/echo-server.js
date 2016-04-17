'use strict';

const net = require( 'net' );

const server = net.createServer( function( socket ) {

    socket.write('Echo server\r\n');
    socket.pipe( socket );
});

server.listen( 42420, '127.0.0.1', function( err ) {

    if( err ) {

        console.log( err );

        process.exit( 1 );
    }

    console.log( 'echo server running' );

    process.send( { ok: true } );

    setTimeout( function() {

        // kill self after 3 seconds

        process.exit( 0 );
    }, 3000 );
});
