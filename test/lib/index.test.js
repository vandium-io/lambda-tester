'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const sinon = require( 'sinon' );

const fs = require( 'fs' );

const freshy = require( 'freshy' );

const appRoot = require( 'app-root-path' );

const LAMBDA_TESTER_PATH = '../../lib/index';

const LAMBDA_LONG_TIMEOUT = 1100;

const LAMBDA_SIMPLE_SUCCEED = function( event, context ) {

    context.succeed( 'ok' );
};

const LAMBDA_SIMPLE_SUCCEED_ARRAY = function( event, context ) {

    if( !Array.isArray( event ) ) {

        return context.fail( new Error( 'bad' ) );
    }

    context.succeed( 'ok' );
};

const LAMBDA_SIMPLE_SUCCEED_DONE = function( event, context ) {

    context.done( null, 'ok' );
};

const LAMBDA_SUCCEED_LONG = function( event, context, callback ) {

    setTimeout( function() {

            context.succeed( 'ok' );
        }, LAMBDA_LONG_TIMEOUT );
}

const LAMBDA_SIMPLE_FAIL = function( event, context ) {

    context.fail( new Error( 'bang' ) );
};

const LAMBDA_SIMPLE_FAIL_STRING = function( event, context ) {

    context.fail( 'bang' );
};

const LAMBDA_SIMPLE_FAIL_DONE = function( event, context ) {

    context.done( new Error( 'bang' ) );
};

const LAMBDA_FAIL_LONG = function( event, context, callback ) {

    setTimeout( function() {

            context.fail( new Error( 'bang' ) );
        }, LAMBDA_LONG_TIMEOUT );
}


const LAMBDA_SIMPLE_CALLBACK_ERROR = function( event, context, callback ) {

    callback( new Error( 'bang' ) );
};

const LAMBDA_CALLBACK_ERROR_LONG = function( event, context, callback ) {

    setTimeout( function() {

            callback( new Error( 'bang' ) );
        }, LAMBDA_LONG_TIMEOUT );
}

const LAMBDA_SIMPLE_CALLBACK = function( event, context, callback ) {

    callback( null, 'ok' );
};

const LAMBDA_CALLBACK_LONG = function( event, context, callback ) {

    if( context.getRemainingTimeInMillis() === 0 ) {

        throw new Error( 'getRemainingTimeInMillis() is not working' );
    }

    setTimeout( function() {

            if( context.getRemainingTimeInMillis() !== 0 ) {

                return callback( new Error( 'remaining time should be 0' ) );
            }

            callback( null, 'ok' );
        }, LAMBDA_LONG_TIMEOUT );
}

const LAMBDA_THROWS = function( event, context, callback ) {

    throw new Error( 'something happened!' );
};


describe( 'lib/index', function() {

    let LambdaTester;

    beforeEach( function() {

        // make sure we have an artifact free version each time
        freshy.unload( LAMBDA_TESTER_PATH );

        LambdaTester = require( LAMBDA_TESTER_PATH );
    });

    describe( 'environment variables', function() {

        it( 'LAMBDA_TASK_ROOT', function() {

            expect( process.env.LAMBDA_TASK_ROOT ).to.exist;

            let path = require( 'app-root-path' ).toString();

            expect( process.env.LAMBDA_TASK_ROOT ).to.equal( path );

            // should be our root - let's try to get our package.json
            let stats = fs.statSync( process.env.LAMBDA_TASK_ROOT + '/package.json' );

            expect( stats.isFile() ).to.be.true;
        });
    });

    describe( 'LambdaTester', function() {

        beforeEach( function() {

            // make sure leak detection is enabled by default
            LambdaTester.checkForResourceLeak( true );
        });

        describe( 'constructor', function() {

            it( 'called without new', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );

                expect( tester._handler ).to.equal( LAMBDA_SIMPLE_SUCCEED );
                expect( tester._context ).to.eql( {} );
                expect( tester._event ).to.eql( {} );
            });

            it( 'called with new', function() {

                let tester = new LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );

                expect( tester._handler ).to.equal( LAMBDA_SIMPLE_SUCCEED );
                expect( tester._context ).to.eql( {} );
                expect( tester._event ).to.eql( {} );
            });

            it( 'called without handler', function() {

                let tester = new LambdaTester();

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );
                expect( tester._handler ).to.not.exist;
                expect( tester._context ).to.eql( {} );
                expect( tester._event ).to.eql( {} );
            });
        });

        describe( '.event', function() {

            it( 'normal operation', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                expect( tester._event ).to.eql( {} );

                let returnValue = tester.event( { one: 1 } );

                expect( returnValue ).to.equal( tester );
                expect( tester._event ).to.eql( { one: 1 } );

                let event = { two: 2 };

                returnValue = tester.event( event );

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );
                expect( tester._event ).to.eql( event );

                // should not be same instance
                expect( tester._event ).to.not.equal( event );
            });

            it( 'event is array of events', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                let e1 = {};
                let e2 = {};

                tester.event( [ e1, e2 ] );

                expect( tester._event ).to.be.an( 'Array' );
                expect( tester._event[0] ).to.equal( e1 );
                expect( tester._event[1] ).to.equal( e2 );
            });
        });

        describe( '.identity', function() {

            it( 'normal operation', function() {

                let tester = LambdaTester( function( event, context, callback ) {

                    expect( context.identity ).to.exist;

                    callback( null, context.identity );
                });

                let returnValue = tester.identity( 'cog-id', 'cog-pool-id' );

                expect( returnValue ).to.equal( tester );

                expect( tester._context ).to.eql( {

                    identity: {

                        cognitoIdentityId: 'cog-id',
                        cognitoIdentityPoolId: 'cog-pool-id'
                    }
                });

                return tester.expectResult( function( result ) {

                        expect( result ).to.eql( { cognitoIdentityId: 'cog-id', cognitoIdentityPoolId: 'cog-pool-id' } );
                    });
            });

            it( 'with context already being set', function() {

                let tester = LambdaTester( function( event, context, callback ) {

                    expect( context.identity ).to.exist;

                    callback( null, context.identity );
                });

                tester.context( { one: 1 } );

                let returnValue = tester.identity( 'cog-id', 'cog-pool-id' );

                expect( returnValue ).to.equal( tester );

                expect( tester._context ).to.eql( {

                    one: 1,
                    identity: {

                        cognitoIdentityId: 'cog-id',
                        cognitoIdentityPoolId: 'cog-pool-id'
                    }
                });

                return tester.expectResult( ( result ) => {

                        expect( result ).to.eql( { cognitoIdentityId: 'cog-id', cognitoIdentityPoolId: 'cog-pool-id' } );
                    });
            });
        });

        describe( '.clientContext', function() {

            it( 'normal operation', function() {

                let clientContext = { client: {} };


                let tester = LambdaTester( function( event, context, callback ) {

                    expect( context.clientContext ).to.exist;

                    callback( null, context.clientContext );
                });

                let returnValue = tester.clientContext( clientContext );

                expect( returnValue ).to.equal( tester );

                expect( tester._context ).to.eql( { clientContext } );

                return tester.expectResult( ( result ) => {

                        // should be the original object
                        expect( result ).to.equal( clientContext );
                    });
            });

            it( 'with context already being set', function() {

                let clientContext = { client: {} };


                let tester = LambdaTester( function( event, context, callback ) {

                    expect( context.clientContext ).to.exist;

                    callback( null, context.clientContext );
                });

                tester.context( { one: 1 } );

                let returnValue = tester.clientContext( clientContext );

                expect( returnValue ).to.equal( tester );

                expect( tester._context ).to.eql( { one: 1, clientContext } );

                return tester.expectResult( ( result ) => {

                        // should be the original object
                        expect( result ).to.equal( clientContext );
                    });
            });
        });

        describe( '.context', function() {

            it( 'normal operation', function() {

                let context = { one: 1, two: 'II', three: 'thr33' };

                let tester = LambdaTester( function( event, context, callback ) {

                    expect( context.one ).to.exist;
                    expect( context.two ).to.exist;
                    expect( context.three ).to.exist;

                    callback( null, { one: context.one, two: context.two, three: context.three } );
                });

                let returnValue = tester.context( context );

                expect( returnValue ).to.equal( tester );

                // should be a copy
                expect( tester._context ).to.not.equal( context );

                expect( tester._context ).to.eql( context );

                return tester.expectResult( ( result ) => {

                        // should not be the original object
                        expect( result ).to.not.equal( context );

                        expect( result ).to.eql( context );
                    });
            });

            it( 'multiple calls', function() {

                let fullContext = { one: 1, two: 'II', three: 'thr33' };

                let tester = LambdaTester( function( event, context, callback ) {

                    expect( context.one ).to.exist;
                    expect( context.two ).to.exist;
                    expect( context.three ).to.exist;

                    callback( null, { one: context.one, two: context.two, three: context.three } );
                });

                tester.context( { a: 1 } );
                tester.context( { b: 1 } );
                tester.context( { c: 1 } );

                // should replace all
                tester.context( fullContext );

                expect( tester._context ).to.eql( fullContext );

                return tester.expectResult( ( result ) => {

                        expect( result ).to.eql( fullContext );
                    });
            });

            it( 'auto generated content - default values', function() {

                let tester = LambdaTester( function( event, context, callback ) {

                    callback( null, Object.assign( {}, context ) );
                });

                return tester.expectResult( ( result ) => {

                    expect( result.functionName ).to.equal( 'testLambda' );
                    expect( result.functionVersion ).to.equal( '$LATEST' );
                    expect( result.memoryLimitInMB ).to.equal( '128' );
                    expect( result.logGroupName ).to.equal( '/aws/lambda/testLambda' );

                    expect( result.logStreamName ).to.contain( '[$LATEST]' );
                    expect( result.logStreamName.length ).to.equal( 52 );

                    expect( result.invokedFunctionArn ).to.equal( 'arn:aws:lambda:us-east-1:999999999999:function:testLambda');

                    expect( result.invokeid ).to.exist;
                    expect( result.invokeid.length ).to.equal( 36 );

                    expect( result.awsRequestId ).to.equal( result.invokeid );
                });
            });

            it( 'auto generated content using default items', function() {

                let tester = LambdaTester( function( event, context, callback ) {

                    callback( null, Object.assign( {}, context ) );
                });

                tester.context( { functionName: 'myLambda', functionVersion: '6', memoryLimitInMB: '256' })

                return tester.expectResult( ( result ) => {

                    expect( result.functionName ).to.equal( 'myLambda' );
                    expect( result.functionVersion ).to.equal( '6' );
                    expect( result.memoryLimitInMB ).to.equal( '256' );
                    expect( result.logGroupName ).to.equal( '/aws/lambda/myLambda' );

                    expect( result.logStreamName ).to.contain( '[6]' );

                    expect( result.invokedFunctionArn ).to.equal( 'arn:aws:lambda:us-east-1:999999999999:function:myLambda');

                    expect( result.invokeid ).to.exist;
                    expect( result.invokeid.length ).to.equal( 36 );

                    expect( result.awsRequestId ).to.equal( result.invokeid );
                });
            });

            it( 'override auto generated content', function() {

                let tester = LambdaTester( function( event, context, callback ) {

                    callback( null, Object.assign( {}, context ) );
                });

                tester.context( {

                    functionName: 'myLambda',
                    functionVersion: '6',
                    memoryLimitInMB: '256',
                    logGroupName: 'myLogGroup',
                    logStreamName: 'myLogStream',
                    invokedFunctionArn: 'arn',
                    invokeid: '1234',
                    awsRequestId: '5678'
                });

                return tester.expectResult( ( result ) => {

                    expect( result.functionName ).to.equal( 'myLambda' );
                    expect( result.functionVersion ).to.equal( '6' );
                    expect( result.memoryLimitInMB ).to.equal( '256' );
                    expect( result.logGroupName ).to.equal( 'myLogGroup' );
                    expect( result.logStreamName ).to.equal( 'myLogStream' );
                    expect( result.invokedFunctionArn ).to.equal( 'arn' );
                    expect( result.invokeid ).to.equal( '1234' );
                    expect( result.awsRequestId ).to.equal( '5678' );
                });
            });
        });

        describe( '.expectSucceed', function() {

            it( 'without verifier', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                let returnValue = tester.expectSucceed();

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'without verifier, event is an array', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED_ARRAY ).event( [ {}, {} ] );

                let returnValue = tester.expectSucceed();

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'without verifier and timeout', function() {

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .timeout( 1 )
                    .expectSucceed();
            });

            it( 'without verifier via context.done()', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED_DONE );

                let returnValue = tester.expectSucceed();

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'with verifier', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                let verifier = sinon.stub();

                let returnValue = tester.expectSucceed( verifier );

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue
                    .then( () => {

                        expect( verifier.calledOnce ).to.be.true;
                        expect( verifier.withArgs( 'ok' ).calledOnce ).to.be.true;
                    });
            });

            it( 'with .verify()', function() {

                let done = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed()
                    .verify( done )
                    .then( () => {

                        expect( done.calledOnce ).to.be.true;
                        expect( done.withArgs().calledOnce ).to.be.true;
                    });
            })

            it( 'with verifier that returns a promise', function() {

                let value = 1;

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed( function( /*result*/ ) {

                        return Promise.resolve()
                            .then( function() {

                                return new Promise( ( resolve /*, reject*/ ) => {

                                    setTimeout( () => { value++; resolve(); }, 10 );
                                });
                            });
                    })
                    .then( () => {

                        expect( value ).to.equal( 2 );
                    });
            });

            it( 'Resource leak but checkForResourceLeak is disabled', function() {

                LambdaTester.checkForResourceLeak( false );

                return LambdaTester( function( event, context, callback) {

                        setTimeout( () => {}, 100 );

                        callback( null, 'ok' );
                    })
                    .expectResult( ( result ) => {

                        expect( result ).to.equal( 'ok' );
                    });
            });

            it( 'Prevent false positive leak detection on timer events', function() {

                LambdaTester.checkForResourceLeak( false );

                return LambdaTester( function( event, context, callback) {

                        setTimeout( () => {

                            callback( null, 'ok' );
                        }, 100 );
                    })
                    .expectResult( ( result ) => {

                        expect( result ).to.equal( 'ok' );
                    });
            });

            it( 'with loadHandler()', function() {

                let tester = LambdaTester();

                let spy = sinon.spy( LAMBDA_SIMPLE_SUCCEED );

                let returnValue = tester.loadHandler( () => {

                    return spy;
                });

                expect( returnValue ).to.equal( tester );

                return tester.expectSucceed( () => {

                    expect( spy.calledOnce ).to.be.true;
                });
            });

            it( 'with after()', function() {

                let myAfter = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .after( myAfter )
                    .expectSucceed()
                    .then( () => {

                        expect( myAfter.calledOnce ).to.be.true;
                    });
            });

            it( 'fail: when loadHandler does not return a handler', function() {

                let tester = LambdaTester();

                let stubLoader = sinon.stub();

                let returnValue = tester.loadHandler( stubLoader );

                expect( returnValue ).to.equal( tester );

                return tester.expectSucceed( () => {

                        throw new Error( 'should not succeed' );
                    })
                    .catch( ( err ) => {

                        expect( err.message ).to.equal( 'no handler specified or returned from loadHandler()' );
                    });
            });

            it( 'fail: when loadHandler throws exception', function() {

                let tester = LambdaTester();

                let stubLoader = sinon.stub().throws( new Error( 'bang' ) );

                let returnValue = tester.loadHandler( stubLoader );

                expect( returnValue ).to.equal( tester );

                return tester.expectSucceed( () => {

                        throw new Error( 'should not succeed' );
                    })
                    .catch( ( err ) => {

                        expect( err.message ).to.equal( 'bang' );
                    });
            });

            it( 'fail: when context.fail() is called', function() {

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectSucceed()
                    .then(
                        () => {

                            throw new Error( 'should not succeed' );
                        },
                        ( err ) => {

                            expect( err.message ).to.equal( 'context.fail() called instead of context.succeed()' );
                            expect( err.cause.message ).to.equal( 'bang' );
                        });
            });

            it( 'fail: when verifier fails with .verify', function() {

                let done = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed( () => {

                        throw new Error( 'bang' );
                    })
                    .verify( done )
                    .then( () => {

                            expect( done.calledOnce ).to.be.true;

                            expect( done.firstCall.args[0] ).to.be.an( 'Error' );
                        }
                    );
            });

            it( 'fail: when callback( null, result ) called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectSucceed( verifier )
                    .then(
                        () => {

                            throw new Error( 'should fail' );
                        },
                        ( err ) => {

                            expect( err.message ).to.equal( 'callback() called instead of context.succeed()' );
                            expect( err.result ).to.equal( 'ok' );
                        }
                    );
            });

            it( 'fail: when callback( err ) called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectSucceed( verifier )
                    .then(
                        () => {

                            throw new Error( 'should fail' );
                        },
                        ( err ) => {

                            expect( err.message ).to.equal( 'callback() called instead of context.succeed()' );
                            expect( err.cause.message ).to.equal( 'bang' );
                        }
                    );
            });

            it( 'fail: when exception thrown inside handler', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_THROWS )
                    .expectSucceed( verifier )
                    .then(
                        () => {

                            throw new Error( 'should not work' );
                        },
                        ( err ) => {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'something happened!' );
                        }
                    );
            });

            it( 'fail: when time exceeds allocated time', function() {

                this.timeout( LAMBDA_LONG_TIMEOUT + 500 );

                return LambdaTester( LAMBDA_SUCCEED_LONG )
                    .timeout( 1 )
                    .expectSucceed()
                    .then(
                        () => {

                            throw new Error( 'should not work' );
                        },
                        ( err ) => {

                            expect( err.message ).to.contain( 'handler timed out - execution time:' );
                        }
                    );
            });

            it( 'fail: when a resource leak is detected from a timer', function() {

                return LambdaTester( function( event, context, callback) {

                        setTimeout( () => {}, 100 );

                        callback( null, 'ok' );
                    })
                    .expectResult( () => {

                        throw new Error( 'should not succeed' );
                    })
                    .catch( ( err ) => {

                        expect( err.message ).to.equal( 'Potential handle leakage detected' );

                        expect( err.handles ).to.exist;
                        expect( err.handles.length ).to.be.at.least( 1 );

                        // our timer
                        expect( err.handles[0]._list.msecs ).to.equal( 100 );
                    });
            });
        });

        describe( '.expectFail', function() {

            it( 'without verifier', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_FAIL );

                let returnValue = tester.expectFail();

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'without verifier, error is a string', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_FAIL_STRING );

                let returnValue = tester.expectFail();

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'without verifier and timeout', function() {

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .timeout( 1 )
                    .expectFail();
            });

            it( 'without verifier via context.done()', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_FAIL_DONE );

                let returnValue = tester.expectFail();

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'with verifier', function() {

                let tester = LambdaTester( LAMBDA_SIMPLE_FAIL );

                let verifier = function( /*err*/ ) {};

                let returnValue = tester.expectFail( verifier );

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'with .verify()', function() {

                let done = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectFail()
                    .verify( done )
                    .then( () => {

                        expect( done.calledOnce ).to.be.true;
                        expect( done.withArgs().calledOnce ).to.be.true;
                    });
            });

            it( 'with verifier that returns a promise', function() {

                let value = 1;

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectFail( function( /*result*/ ) {

                        return Promise.resolve()
                            .then( () => {

                                return new Promise( ( resolve /*, reject*/ ) => {

                                    setTimeout( () => { value++; resolve(); }, 10 );
                                });
                            });
                    })
                    .then( () => {

                        expect( value ).to.equal( 2 );
                    });
            });

            it( 'with loadHandler()', function() {

                let tester = LambdaTester();

                let spy = sinon.spy( LAMBDA_SIMPLE_FAIL );

                let returnValue = tester.loadHandler( () => {

                    return spy;
                });

                expect( returnValue ).to.equal( tester );

                return tester.expectFail( () => {

                    expect( spy.calledOnce ).to.be.true;
                });
            });

            it( 'with after()', function() {

                let myAfter = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .after( myAfter )
                    .expectFail( () => {

                        expect( myAfter.called ).to.be.false;
                    })
                    .then( () => {

                        expect( myAfter.calledOnce ).to.be.true;
                    });
            });

            it( 'fail: when context.succeed() is called', function() {

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectFail()
                    .then(
                        () => {

                            throw new Error( 'should not succeed' );
                        },
                        ( err ) => {

                            expect( err.message ).to.equal( 'context.succeed() called instead of context.fail()' );
                            expect( err.result ).to.equal( 'ok' );
                        });
            });

            it( 'fail: when verifier fails with .verify', function() {

                let done = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectFail( function( /*err*/ ) {

                        throw new Error( 'boom' );
                    })
                    .verify( done )
                    .then( () => {

                            expect( done.calledOnce ).to.be.true;

                            expect( done.firstCall.args[0] ).to.be.an( 'Error' );
                        }
                    );
            });
            it( 'fail: when callback( null, result ) called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectFail( verifier )
                    .then(
                        () => {

                            throw new Error( 'should fail' );
                        },
                        ( err ) => {

                            expect( err.message ).to.equal( 'callback() called instead of context.fail()' );
                            expect( err.result ).to.equal( 'ok' );
                        }
                    );
            });

            it( 'fail: when callback( err ) called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectFail( verifier )
                    .then(
                        () => {

                            throw new Error( 'should fail' );
                        },
                        ( err ) => {

                            expect( err.message ).to.equal( 'callback() called instead of context.fail()' );
                            expect( err.cause.message ).to.equal( 'bang' );
                        }
                    );
            });

            it( 'fail: when exception thrown inside handler', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_THROWS )
                    .expectFail( verifier )
                    .then(
                        () => {

                            throw new Error( 'should not work' );
                        },
                        ( err ) => {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'something happened!' );
                        }
                    );
            });

            it( 'fail: when time exceeds allocated time', function() {

                this.timeout( LAMBDA_LONG_TIMEOUT + 500 );

                return LambdaTester( LAMBDA_FAIL_LONG )
                    .timeout( 1 )
                    .expectFail()
                    .then(
                        () => {

                            throw new Error( 'should not work' );
                        },
                        ( err ) => {

                            expect( err.message ).to.contain( 'handler timed out - execution time:' );
                        }
                    );
            });
        });

        describe( '.expectError', function() {

            it( 'without verifier', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectError();
            });

            it( 'without verifier and timeout', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .timeout( 1 )
                    .expectError();
            });

            it( 'with verifier', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectError( ( err ) => {

                        expect( err.message ).to.equal( 'bang' );
                    });
            });

            it( 'with loadHandler()', function() {

                let tester = LambdaTester();

                let spy = sinon.spy( LAMBDA_SIMPLE_CALLBACK_ERROR );

                let returnValue = tester.loadHandler( () => {

                    return spy;
                });

                expect( returnValue ).to.equal( tester );

                return tester.expectError( () => {

                    expect( spy.calledOnce ).to.be.true;
                });
            });

            it( 'with after()', function() {

                let myAfter = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .after( myAfter )
                    .expectError( () => {

                        expect( myAfter.called ).to.be.false;
                    })
                    .then( () => {

                        expect( myAfter.calledOnce ).to.be.true;
                    });
            });

            it( 'fail: when context.fail() called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectError( verifier )
                    .then(
                        () => {

                            throw new Error( 'should not work' );
                        },
                        ( err ) => {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'context.fail() called instead of callback()' );
                        }
                    );
            });

            it( 'fail: when context.succeed() called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectError( verifier )
                    .then(
                        () => {

                            throw new Error( 'should not work' );
                        },
                        ( err ) => {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'context.succeed() called instead of callback()' );
                        }
                    );
            });

            it( 'fail: when callback( null, result ) called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectError( verifier )
                    .then(
                        () => {

                            throw new Error( 'should not work' );
                        },
                        ( err ) => {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'expecting error but got result' );
                            expect( err.result ).to.equal( 'ok' );
                        }
                    );
            });

            it( 'fail: when exception thrown inside handler', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_THROWS )
                    .expectError( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'something happened!' );
                        }
                    );
            });

            it( 'fail: when time exceeds allocated time', function() {

                this.timeout( LAMBDA_LONG_TIMEOUT + 500 );

                return LambdaTester( LAMBDA_CALLBACK_ERROR_LONG )
                    .timeout( 1 )
                    .expectError()
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },
                        function( err ) {

                            expect( err.message ).to.contain( 'handler timed out - execution time:' );
                        }
                    );
            });
        });

        describe( '.expectResult', function() {

            it( 'without verifier', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectResult();
            });

            it( 'without verifier and timeout', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .timeout( 1 )
                    .expectResult();
            });

            it( 'with verifier', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectResult( function( result ) {

                        expect( result ).to.equal( 'ok' );
                    });
            });

            it( 'with loadHandler()', function() {

                let tester = LambdaTester();

                let spy = sinon.spy( LAMBDA_SIMPLE_CALLBACK );

                let returnValue = tester.loadHandler( function() {

                    return spy;
                });

                expect( returnValue ).to.equal( tester );

                return tester.expectResult( function() {

                    expect( spy.calledOnce ).to.be.true;
                });
            });

            it( 'with after()', function() {

                let myAfter = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .after( myAfter )
                    .expectResult( function() {

                        expect( myAfter.called ).to.be.false;
                    })
                    .then( function() {

                        expect( myAfter.calledOnce ).to.be.true;
                    });
            });

            it( 'fail: when context.fail() called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectResult( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'context.fail() called instead of callback()' );
                        }
                    );
            });

            it( 'fail: when context.succeed() called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectResult( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'context.succeed() called instead of callback()' );
                        }
                    );
            });

            it( 'fail: when callback( err ) called', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectResult( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'expecting result but error was thrown' );
                        }
                    );
            });

            it( 'fail: when exception thrown inside handler', function() {

                let verifier = sinon.stub();

                return LambdaTester( LAMBDA_THROWS )
                    .expectResult( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'something happened!' );
                        }
                    );
            });

            it( 'fail: when time exceeds allocated time', function() {

                this.timeout( LAMBDA_LONG_TIMEOUT + 500 );

                return LambdaTester( LAMBDA_CALLBACK_LONG )
                    .timeout( 1 )
                    .expectResult()
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },
                        function( err ) {

                            expect( err.message ).to.contain( 'handler timed out - execution time:' );
                        }
                    );
            });
        });

        describe( '.verify', function() {

            it( 'with .verify() and done.fail()', function() {

                let done = sinon.stub();

                done.fail = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectResult()
                    .verify( done )
                    .then( () => {

                        expect( done.called ).to.be.false;

                        expect( done.fail.calledOnce ).to.be.true;
                        expect( done.fail.withArgs().calledOnce ).to.be.true;
                    });
            });
        });

        describe( '.env', function() {

            let envPath = appRoot + '/.env';

            beforeEach( function() {

                delete process.env.TEST_VALUE;
                delete process.env.LAMBDA_TESTER_NO_ENV;

                freshy.unload( 'dotenv' );

                freshy.unload( LAMBDA_TESTER_PATH );

                try {

                    fs.unlinkSync( envPath );
                }
                catch( err ) {

                    // ignore
                }
            });

            after( function() {

                freshy.unload( LAMBDA_TESTER_PATH );

                delete process.env.LAMBDA_TESTER_NO_ENV;

                LambdaTester = require( LAMBDA_TESTER_PATH );
            });

            it( 'without .env', function() {

                LambdaTester = require( LAMBDA_TESTER_PATH );

                expect( process.env.TEST_VALUE ).to.not.exist;
            });

            it( 'with .env', function() {

                fs.writeFileSync( envPath, 'TEST_VALUE=test' );

                LambdaTester = require( LAMBDA_TESTER_PATH );

                expect( process.env.TEST_VALUE ).to.exist;
                expect( process.env.TEST_VALUE ).to.equal( 'test' );
            });

            it( 'with .env and LAMBDA_TESTER_NO_ENV defined', function() {

                process.env.LAMBDA_TESTER_NO_ENV = true;

                LambdaTester = require( LAMBDA_TESTER_PATH );

                expect( process.env.TEST_VALUE ).to.not.exist;
            });
        });

        describe( '.noVersionCheck', function() {

            let originalProcess = process;

            afterEach( function() {

                process = originalProcess;
            });

            it( 'with version checking (default)', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectResult();
            });

            it( 'with version checking (no version check)', function() {

                process = Object.assign( {}, originalProcess );
                process.versions =  { node: '3.3.3' };

                LambdaTester.noVersionCheck();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectResult();
            });

            it( 'with version checking (older node version)', function() {

                process = Object.assign( {}, originalProcess );
                process.versions =  { node: '4.3.1' };

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectResult()
                    .then(
                        () => {
                            throw new Error( 'should not work' );
                        },
                        ( err ) => {
                            expect( err.message ).to.contain( 'Please test with node.js' );
                        }
                    );
            });

            it( 'with version checking (node 7.0.0)', function() {

                process = Object.assign( {}, originalProcess );
                process.versions =  { node: '7.0.0' };

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectResult()
                    .then(
                        () => {
                            throw new Error( 'should not work' );
                        },
                        ( err ) => {
                            expect( err.message ).to.contain( 'node.js 7.x is not currently supported' );
                        }
                    );
            });
        });
    });
});
