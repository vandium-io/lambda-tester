'use strict';

const expect = require( 'chai' ).expect;

const net = require( 'net' );

const fork = require('child_process').fork;

const handleState = require( '../../lib/handle_state' );

describe( 'lib/handle_state', function() {

    describe( 'ActiveHandleState', function() {

        describe( 'constructor', function() {

            it( 'normal operation', function() {

                let instance = handleState.capture();

                expect( instance.constructor.name ).to.equal( 'ActiveHandleState' );
                expect( instance.savedState ).to.exist;
                expect( instance.savedState ).to.be.an( 'Array' );
            });
        });

        describe( '.getDifferenceInHandles', function() {

            it( 'no change', function() {

                let instance = handleState.capture();

                let difference = instance.getDifferenceInHandles();

                expect( difference ).to.be.an( 'Array' );
                expect( difference.length ).to.equal( 0 );
            });

            it( 'timers that are finished but not removed', function( done ) {

                let instance = handleState.capture();

                setTimeout( function() {

                    let difference = instance.getDifferenceInHandles();

                    expect( difference ).to.be.an( 'Array' );
                    expect( difference.length ).to.equal( 0 );

                    done();
                }, 10 );
            });

            it( 'sockets that are open', function( done ) {

                let echoServer = fork( './test-other/echo-server', [], { silent: true } );

                echoServer.on( 'message', () => {

                    let instance = handleState.capture();

                    let client = new net.Socket();

                    client.connect( 42420, '127.0.0.1', function() {

                        client.write( 'Hello' );
                    });

                    client.on( 'data', function() {

                        let difference = instance.getDifferenceInHandles();

                        expect( difference ).to.be.an( 'Array' );
                        expect( difference.length ).to.equal( 1 );
                        expect( difference[0].constructor.name ).to.equal( 'Socket' );

                        client.destroy(); // kill client after server's response
                    });

                    client.on( 'close', function() {

                        let difference = instance.getDifferenceInHandles();

                        expect( difference ).to.be.an( 'Array' );
                        expect( difference.length ).to.equal( 0 );

                        echoServer.kill();

                        done();
                    });
                });
            });

            it( 'resource left open', function() {

                let instance = handleState.capture();

                let timerId = setTimeout( function() {}, 100 );

                let difference = instance.getDifferenceInHandles();

                expect( difference ).to.be.an( 'Array' );
                expect( difference.length ).to.equal( 1 );

                clearTimeout( timerId );
            });
        });
    });
});
