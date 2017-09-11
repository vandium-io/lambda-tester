'use strict';

const Promise = require( 'bluebird' );

const dgram = Promise.promisifyAll( require( 'dgram' ) );

const sinon = require( 'sinon' );

const proxyquire = require( 'proxyquire' );

const expect = require( 'chai' ).expect;

function setTimeoutAsync( delay ) {

    return new Promise( ( resolve /*, reject*/ ) => {

        setTimeout( () => {

            resolve();

        }, delay );
    });
}

describe( 'lib/xray/server', function() {

    describe( '.processMessage', function() {

        it( 'valid message', function() {

            let server = require( '../../../lib/xray/server' );

            return server.start()
                .then( () => {

                    let AWSXRay = require( 'aws-xray-sdk-core' );

                    let segment = AWSXRay.getSegment().addNewSubsegment( 'test-segment' );

                    segment.close();

                    return setTimeoutAsync( 500 );
                })
                .then( () => {

                    expect( server.segments.length ).to.equal( 1 );

                    return server.stop();
                });
        });

        it( 'invalid message', function() {

            let server = require( '../../../lib/xray/server' );

            let consoleLogStub = sinon.spy( console, 'log' );

            return server.start()
                .then( () => {

                    let message = Buffer.from( 'Some bytes' );

                    let client = dgram.createSocket( 'udp4' );

                    return client.sendAsync( message, 2000, 'localhost' );
                })
                .then( () => {

                    return setTimeoutAsync( 500 );
                })
                .then( () => {

                    console.log.restore();

                    expect( consoleLogStub.firstCall.args[ 0 ] ).to.equal( 'error while processing message:' );
                    expect( consoleLogStub.firstCall.args[ 1 ].message ).to.equal( 'Unexpected token u in JSON at position 0' );

                    return server.stop();
                });
        });
    });

    describe( '.createServer', function() {

        it( 'no process.env.LAMBDA_TASK_ROOT', function() {

            delete process.env.LAMBDA_TASK_ROOT;

            let server = require( '../../../lib/xray/server' );

            return server.start()
                .then( () => {

                    let appRootPath = require( 'app-root-path' );

                    expect( process.env.LAMBDA_TASK_ROOT ).to.equal( appRootPath.toString() );

                    return server.stop();
                });
        });

        it( 'server already running', function() {

            let server = require( '../../../lib/xray/server' );

            return server.start()
                .then( () => {

                    return server.start();
                })
                .then( () => {

                    throw new Error( 'should not be able to start the server a second time' );
                })
                .catch( ( err ) => {

                    expect( err ).to.exist;
                    expect( err.message ).to.equal( 'server already running' );

                    return server.stop();
                });
        });

        it( 'server on error', function() {

            let onStub = sinon.stub();

            let server = proxyquire( '../../../lib/xray/server', {

                'dgram': {

                    createSocket: sinon.stub().returns({

                        on: onStub,
                        bind: ( port, addr, callback ) => callback(),
                        close: sinon.stub()
                    })
                }
            });

            server.start();

            let onFunc = onStub.firstCall.args[ 1 ];

            let consoleLogStub = sinon.spy( console, 'log' );

            onFunc( { stack: 'overflow' } );

            console.log.restore();

            expect( consoleLogStub.calledOnce ).to.be.true;
            expect( consoleLogStub.withArgs( 'server error:\noverflow' ).calledOnce ).to.be.true;
        });
    });

    describe( '.reset', function() {

        it( 'server exists', function() {

            let server = require( '../../../lib/xray/server' );

            return server.start()
                .then( () => {

                    let AWSXRay = require( 'aws-xray-sdk-core' );

                    let segment = AWSXRay.getSegment().addNewSubsegment( 'test-segment' );

                    segment.close();

                    return setTimeoutAsync( 500 );
                })
                .then( () => {

                    expect( server.segments.length ).to.equal( 1 );

                    server.reset();

                    expect( server.segments ).to.eql( [] );

                    return server.stop();
                });
        });

        it( 'no server', function() {

            let server = require( '../../../lib/xray/server' );

            server.reset();
        });
    });
});
