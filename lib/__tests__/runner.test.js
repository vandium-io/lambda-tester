'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const sinon = require( 'sinon' );

const net = require('net');

const LambdaRunner = require( '../runner' );

const States = require( '../states' );

const DEFAULT_SERVER_PORT = 10005;

function createTestServer( port = DEFAULT_SERVER_PORT ) {

    const server = net.createServer(function(socket) {
     socket.write('Echo server\r\n');
     socket.pipe(socket);
    });

    server.listen(port, '127.0.0.1');

    return server;
}

describe( 'lib/runner', function() {

    describe( 'LambdaRunner', function() {

        describe( 'constructor', function() {

            it( 'using defaults', function() {

                let instance = new LambdaRunner( States.callbackResult );

                expect( instance.expectedState ).to.equal( States.callbackResult );
                expect( instance.verifier ).to.be.undefined;
                expect( instance.timeout ).to.equal( 3000 );
                expect( instance.enforceTimeout ).to.be.false;
                expect( instance.wantLeakDetection ).to.be.false;
            });

            it( 'using specified options and verifier', function() {

                let verifier = function() {};

                let instance = new LambdaRunner( States.callbackResult, verifier, { timeout: 10000, checkForHandleLeak: true } );

                expect( instance.expectedState ).to.equal( States.callbackResult );
                expect( instance.verifier ).to.equal( verifier );
                expect( instance.timeout ).to.equal( 10000 );
                expect( instance.enforceTimeout ).to.be.true;
                expect( instance.wantLeakDetection ).to.be.true;
            });
        });

        describe( '.withEvent', function() {

            it( 'normal operation', function() {

                let instance = new LambdaRunner( States.callbackResult, null, {} );

                expect( instance.event ).to.not.exist;

                let returnValue = instance.withEvent( {} );

                expect( returnValue ).to.equal( instance );
                expect( instance.event ).to.exist;
                expect( instance.event ).to.eql( {} );
            });
        });

        describe( '.withContext', function() {

            it( 'normal operation', function() {

                let instance = new LambdaRunner( States.callbackResult, null, {} );

                expect( instance.context ).to.not.exist;

                let returnValue = instance.withContext( { whatever: 1234} );

                expect( returnValue ).to.equal( instance );

                expect( instance.context ).to.exist;
                expect( instance.context.functionName ).to.exist;
                expect( instance.context.functionVersion ).to.exist;
                expect( instance.context.memoryLimitInMB ).to.exist;
                expect( instance.context.logGroupName ).to.exist;
                expect( instance.context.logStreamName ).to.exist;
                expect( instance.context.invokedFunctionArn ).to.exist;
                expect( instance.context.invokeid ).to.exist;
                expect( instance.context.awsRequestId ).to.exist;

                expect( instance.context.whatever ).to.equal( 1234 );
            });
        });

        describe( '.run', function() {

            it( 'successful callbackResult using defaults', function() {

                let instance = new LambdaRunner( States.callbackResult, null, {} ).withEvent( {} );

                return instance.run( (event, context, callback) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        callback( null, 'ok' );
                    });
            });

            it( 'successful callbackResult with event, context, and verifier', function() {

                let verifier = sinon.stub();

                let instance = new LambdaRunner( States.callbackResult, verifier, { checkForHandleLeak: true } )
                    .withEvent( { answer: 42 } )
                    .withContext( { whatever: true } );

                return instance.run( (event, context, callback) => {

                        expect( event ).to.eql( { answer: 42 } );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;
                        expect( context.whatever ).to.be.true;

                        callback( null, 'ok' );
                    })
                    .then( () => {

                        expect( verifier.calledOnce ).to.be.true;
                        expect( verifier.firstCall.args[0] ).to.equal( 'ok' );
                        expect( verifier.firstCall.args[1].execTime ).to.exist;
                    });
            });

            it( 'successful callbackError using defaults', function() {

                let instance = new LambdaRunner( States.callbackError, null, {} ).withEvent( {} );

                return instance.run( (event, context, callback) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        callback( new Error( 'bang' ) );
                    });
            });

            it( 'successful Promise.resolve using defaults', function() {

                let instance = new LambdaRunner( States.promiseResolve, null, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        return Promise.resolve( 'ok' );
                    });
            });

            it( 'successful Promise.resolve with event, context, and verifier', function() {

                let verifier = sinon.stub();

                let instance = new LambdaRunner( States.promiseResolve, verifier, { checkForHandleLeak: true } )
                    .withEvent( { answer: 42 } )
                    .withContext( { whatever: true } );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( { answer: 42 } );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;
                        expect( context.whatever ).to.be.true;

                        return Promise.resolve( 'ok' );
                    })
                    .then( () => {

                        expect( verifier.calledOnce ).to.be.true;
                        expect( verifier.firstCall.args[0] ).to.equal( 'ok' );
                        expect( verifier.firstCall.args[1].execTime ).to.exist;
                    });
            });

            it( 'successful Promise.reject using defaults', function() {

                let instance = new LambdaRunner( States.promiseReject, null, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        return Promise.reject( new Error( 'bang' ) );
                    });
            });

            it( 'successful context.succeed using defaults', function() {

                let instance = new LambdaRunner( States.contextSucceed, null, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        context.succeed( 'ok' );
                    });
            });

            it( 'successful context.succeed using defaults, handler calling done', function() {

                let instance = new LambdaRunner( States.contextSucceed, null, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        context.done( null, 'ok' );
                    });
            });

            it( 'maintains the stack when there is an unexpected failure and context.succeed expected', function() {

                let instance = new LambdaRunner( States.contextSucceed, null, {} ).withEvent( {} );

                return instance.run( (event, context) => {
                        return new Promise(() => {
                            throw new Error('Bang');
                        });
                    }).then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {
                            expect( err.stack ).to.contain( 'runner.test.js' );
                        }
                    );
            });

            it( 'successful contextFail using defaults', function() {

                let instance = new LambdaRunner( States.contextFail, null, { timeout: 3000 } ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 2900 );

                        context.fail( new Error( 'bang' ) );
                    });
            });

            it( 'successful contextFail using defaults, handler calling done', function() {

                let instance = new LambdaRunner( States.contextFail, null, { timeout: 3000 } ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 2900 );

                        context.done( new Error( 'bang' ) );
                    });
            });

            it( 'successful contextFail using defaults, error is a string', function() {

                let verifier = sinon.stub();

                let instance = new LambdaRunner( States.contextFail, verifier, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        context.fail( 'bang' );
                    })
                    .then( () => {

                        expect( verifier.calledOnce ).to.be.true;
                        expect( verifier.firstCall.args[0].constructor.name ).to.equal( 'Error' );
                        expect( verifier.firstCall.args[0].message ).to.equal( 'bang' );
                    });
            });

            it( 'fail when contextFail requested and context.succeed called', function() {

                let instance = new LambdaRunner( States.contextFail, null, { strict: true } ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        context.succeed( 'ok' );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.equal( 'context.succeed() called instead of context.fail()' );
                        }
                    );
            });

            it( 'fail when timeout occurs', function() {

                let instance = new LambdaRunner( States.contextFail, null, { timeout: 1000 } );

                return instance.run( (event, context, callback) => {

                        setTimeout( () => {

                            callback( null, 'ok' );

                        }, 1010 );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.contain( 'timeout after: 1000ms' );
                        }
                    );
            });

            it( 'fail when callback used, expects a result but error is passed', function() {

                let instance = new LambdaRunner( States.callbackResult, null, { strict: true} );

                return instance.run( (event, context, callback) => {

                        callback( new Error( 'bang' ) );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.equal( 'callback(error) called instead of callback(null,result)' );
                        }
                    );
            });

            it( 'fail when callback used, expects an error but result is passed', function() {

                let instance = new LambdaRunner( States.callbackError, null, { strict: true } );

                return instance.run( (event, context, callback) => {

                        callback( null, 'ok' );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.equal( 'callback(null,result) called instead of callback(error)' );
                        }
                    );
            });

            it( 'fail when error thrown during execution', function() {

                let instance = new LambdaRunner( States.callbackError, null, {} );

                return instance.run( (event, context, callback) => {

                        throw new Error( 'bang' );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.equal( 'bang' );
                        }
                    );
            });

            it( 'fail when leak is detected', async function() {

                let instance = new LambdaRunner( States.callbackResult, null, { checkForHandleLeak: true } );

                const server = createTestServer();

                let client;

                try {

                    await instance.run( (event, context, callback) => {

                            client = new net.Socket();
                            client.connect( DEFAULT_SERVER_PORT, '127.0.0.1', () => {} );
                            callback( null, 'ok' );
                        });

                    throw new Error( 'should not resolve' );
                }
                catch( err ) {

                    expect( err.message ).to.equal( 'Potential handle leakage detected' );
                }
                finally {

                    if( client ) {

                        client.destroy();
                    }

                    server.close();
                }
            });
        });
    });
});
