'use strict';

const lambdaLeak = require( 'lambda-leak' );

const utils = require( './utils' );

const DEFAULT_TIMEOUT = 3000; // s3

var checkForHandleLeak = false;


function createContext( tester ) {

    let context = Object.assign( {}, tester._context );

    context.done = function( err, result ) {

            if( err ) {

                return this.fail( err );
            }

            return this.succeed( result );
        };

    if( !context.functionName ) {

        context.functionName = 'testLambda';
    }

    if( !context.functionVersion ) {

        context.functionVersion = '$LATEST';
    }

    if( !context.memoryLimitInMB ) {

        context.memoryLimitInMB = '128';
    }

    if( !context.logGroupName ) {

        context.logGroupName = '/aws/lambda/' + context.functionName;
    }

    if( !context.logStreamName ) {

        context.logStreamName = utils.createLogStreamName( context.functionVersion, new Date() );
    }

    if( !context.invokedFunctionArn ) {

        context.invokedFunctionArn = utils.createFunctionArn( context.functionName );
    }

    if( !context.invokeid ) {

        context.invokeid = utils.createId();
    }

    if( !context.awsRequestId ) {

        context.awsRequestId = context.invokeid;
    }

    return context;
}

function createFailCallback( reject ) {

    return function( err, result ) {

            if( err ) {

                let failError = new Error( 'callback called with error parameter' );
                failError.cause = err;

                return reject( failError );
            }

            let failError = new Error( 'callback called' );
            failError.result = result;

            reject( failError );
        };
}

function createCallbackContext( tester, reject ) {

    let context = createContext( tester );

    context.succeed = function( result ) {

            var failError = new Error( 'context.succeed() called before callback' );
            failError.result = result;

            reject( failError );
        };

    context.fail = function( err ) {

            var failError = new Error( 'context.fail() called before callback' );
            failError.cause = err;

            reject( failError );
        };

    return context;
}

function runHandler( tester, context, callback, reject ) {

    try {

        tester._startTime = Date.now();

        tester._handler( tester._event, context, callback );
    }
    catch( err ) {

        reject( err );
    }
}

function createGetRemainingTimeInMillis( tester ) {

    return function() {

        let remaining = tester._timeout - (Date.now() - tester._startTime);

        if( remaining < 0 ) {

            remaining = 0;
        }

        return remaining;
    }
}

function verifyResult( tester, result, verifier, resolve, reject, savedHandleState ) {

    try {

        let execTime = (Date.now() - tester._startTime);

        if( tester._enforceTimeout && (execTime >= tester._timeout) ) {

            throw new Error( 'handler timed out - execution time: ' + execTime + 'ms, timeout after: ' + tester._timeout + 'ms' );
        }

        if( checkForHandleLeak ) {

            let handleDifference = savedHandleState.getDifferenceInHandles();

            if( handleDifference.length > 0 ) {

                let err = new Error( 'Potential handle leakage detected' );
                err.handles = handleDifference;

                throw err;
            }
        }

        resolve( verifier( result, { execTime } ) );
    }
    catch( err ) {

        reject( err );
    }
}

function resolveHandler( tester ) {

    return new Promise( function( resolve, reject ) {

        try {

            if( tester._loadHandler ) {

                tester._handler = tester._loadHandler()
            }

            if( !tester._handler ) {

                throw new Error( 'no handler specified or returned from loadHandler()' );
            }

            resolve( tester._handler );
        }
        catch( err ) {

            reject( err );
        }
    });
}

function addLegecyVerify( promise ) {

    promise.verify = function( done ) {

            return promise.then(
                function() {

                    done();
                },
                function( err ) {

                    done( err );
                }
            );
        }
}

function addCleanup( promise, tester ) {

    let afterFunc = tester._afterFunc;

    if( !afterFunc ) {

        afterFunc = function() {};
    }

    promise.then(

        function( result ) {

            afterFunc( result, true );

            return result;
        },
        function( err ) {

            afterFunc( err, false );

            return Promise.reject( err );
        }
    );
}

class LambdaTester {

    constructor( handler ) {

        if( handler ) {

            this._handler = handler;
        }

        this._context = {};

        this._event = {};

        this._timeout = DEFAULT_TIMEOUT;
    }

    loadHandler( loaderFunc ) {

        this._loadHandler = loaderFunc;

        return this;
    }

    after( afterFunc ) {

        this._afterFunc = afterFunc;

        return this;
    }

    event( evt ) {

        if( !evt ) {

            throw new Error( 'missing event' );
        }

        this._event = evt;

        return this;
    }

    context( ctx )  {

        // copy entire context
        this._context = Object.assign( {}, ctx );

        return this;
    }

    clientContext( clientContext ) {

        this._context = Object.assign( this._context, { clientContext } );

        return this;
    }

    identity( cognitoIdentityId, cognitoIdentityPoolId ) {

        this._context = Object.assign( this._context, {

                identity: {

                    cognitoIdentityId,
                    cognitoIdentityPoolId
                }
            });

        return this;
    }

    timeout( seconds ) {

        this._timeout = seconds * 1000;
        this._enforceTimeout = true;

        return this;
    }

    expectSucceed( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        let context = createContext( this );

        let self = this;

        let promise = resolveHandler( this )
            .then( function() {

                let savedHandleState = lambdaLeak.capture();

                // need to do a nested promise because mocha injects a timer between the start of the
                // promise and .then()
                return new Promise( function( resolve, reject ) {

                    context.succeed = function( result ) {

                        // if memory is beyond, throw exception


                        verifyResult( self, result, resultVerifier, resolve, reject, savedHandleState );
                    };

                    context.fail = function( err ) {

                        var failError = new Error( 'encountered error but expected the handler to succeed - cause: ' + err.message );
                        failError.cause = err;

                        reject( failError );
                    };

                    context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( self );

                    let callback = createFailCallback( reject );

                    runHandler( self, context, callback, reject );
            });
        });

        // support for v1 users
        addLegecyVerify( promise );

        addCleanup( promise, this );

        return promise;
    }

    expectFail( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        let context = createContext( this );

        let self = this;

        let promise = resolveHandler( this )
            .then( function() {

                let savedHandleState = lambdaLeak.capture();

                // need to do a nested promise because mocha injects a timer between the start of the
                // promise and .then()
                return new Promise( function( resolve, reject ) {

                    context.fail = function( errResult ) {

                        verifyResult( self, errResult, resultVerifier, resolve, reject, savedHandleState );
                    };

                    context.succeed = function( result ) {

                        var failError = new Error( 'encountered successful operation but expected failure - result: ' + result );
                        failError.result = result;

                        reject( failError );
                    };

                    context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( self );

                    let callback = createFailCallback( reject );

                    runHandler( self, context, callback, reject );
                });
            });

        // support for v1 users
        addLegecyVerify( promise );

        addCleanup( promise, this );

        return promise;
    }

    expectError( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        let self = this;

        let promise = resolveHandler( this )
            .then( function() {

                // need to do a nested promise because mocha injects a timer between the start of the
                // promise and .then()
                let savedHandleState = lambdaLeak.capture();

                return new Promise( function( resolve, reject ) {

                    let context = createCallbackContext( self, reject );

                    context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( self );

                    var callback = function( err, result ) {

                        if( err ) {

                            return verifyResult( self, err, resultVerifier, resolve, reject, savedHandleState );
                        }

                        let failError = new Error( 'expecting error but got result: ' + result );
                        failError.result = result;

                        reject( failError );
                    }

                    runHandler( self, context, callback, reject );
                });
            });

        addCleanup( promise, this );

        return promise;
    }

    expectResult( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        let self = this;

        let promise = resolveHandler( this )
            .then( function() {

                // need to do a nested promise because mocha injects a timer between the start of the
                // promise and .then()
                let savedHandleState = lambdaLeak.capture();

                return new Promise( function( resolve, reject ) {

                    let context = createCallbackContext( self, reject );

                    context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( self );

                    let callback = function( err, result ) {

                        if( err ) {

                            let failError = new Error( 'expecting result but error was thrown  - cause: ' + err.message  );
                            failError.cause = err;

                            return reject( failError );
                        }

                        verifyResult( self, result, resultVerifier, resolve, reject, savedHandleState );
                    }

                    runHandler( self, context, callback, reject );
                });
            });

        addCleanup( promise, this );

        return promise;
    }
}

function LambdaTesterModule( handler ) {

    return new LambdaTester( handler );
}

LambdaTesterModule.checkForResourceLeak = function( enable ) {

    checkForHandleLeak = (enable === true);
}

// Set the task root to the app's root if not already set
process.env.LAMBDA_TASK_ROOT = require( 'app-root-path' );

if( !process.env.LAMBDA_TESTER_NO_ENV ) {

    // configure env varaiables
    require( 'dotenv' ).config( { silent: true } );
}

module.exports = LambdaTesterModule;
