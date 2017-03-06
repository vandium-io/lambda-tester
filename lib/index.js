'use strict';

const lambdaLeak = require( 'lambda-leak' );

const utils = require( './utils' );

const DEFAULT_TIMEOUT = 3000; // s3

const TARGET_NODE_VERSION = '4.3.2';

var checkForHandleLeak = false;

var checkVersion = true;

function noop_func() {}

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

function convertError( err ) {

    if( utils.isString( err ) ) {

        err = new Error( err );
    }

    return err;
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

            err = convertError( err );

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

        verifier = verifier || noop_func;

        resolve( verifier( result, { execTime } ) );
    }
    catch( err ) {

        reject( err );
    }
}

function resolveHandler( tester ) {

    return new Promise( ( resolve, reject ) => {

        try {

            if( checkVersion && (process.versions.node !== TARGET_NODE_VERSION) ) {

                throw new Error( 'Please test with node.js ' + TARGET_NODE_VERSION );
            }

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

function addVerify( promise ) {

    promise.verify = ( done ) => {

            // done.fail for jasmine users
            return promise.then( done, done.fail || done );
        }
}

function addCleanup( promise, tester ) {

    let afterFunc = tester._afterFunc || noop_func;

    promise.then(

        ( result ) => {

            afterFunc( result, true );

            return result;
        },
        ( err ) => {

            afterFunc( err, false );

            // rethrow
            throw err;
        }
    );
}

class LambdaTester {

    constructor( handler ) {

        this._handler = handler;

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

        evt = evt || {};

        if( utils.isObject( evt ) && !Array.isArray( evt ) ) {

            this._event = Object.assign( {}, evt );
        }
        else {

            this._event = evt;
        }

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

        let context = createContext( this );

        let promise = resolveHandler( this )
            .then( () => {

                let savedHandleState = lambdaLeak.capture();

                // need to do a nested promise because mocha injects a timer between the start of the
                // promise and .then()
                return new Promise( ( resolve, reject ) => {

                    context.succeed = ( result ) => {

                        // FUTURE: if memory is beyond, throw exception

                        verifyResult( this, result, resultVerifier, resolve, reject, savedHandleState );
                    };

                    context.fail = ( err )  =>{

                        err = convertError( err );

                        var failError = new Error( 'encountered error but expected the handler to succeed - cause: ' + err.message );
                        failError.cause = err;

                        reject( failError );
                    };

                    context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( this );

                    let callback = createFailCallback( reject );

                    runHandler( this, context, callback, reject );
            });
        });

        addVerify( promise );

        addCleanup( promise, this );

        return promise;
    }

    expectFail( resultVerifier ) {

        let context = createContext( this );

        let promise = resolveHandler( this )
            .then( () => {

                let savedHandleState = lambdaLeak.capture();

                // need to do a nested promise because mocha injects a timer between the start of the
                // promise and .then()
                return new Promise( ( resolve, reject ) => {

                    context.fail = ( errResult ) => {

                        verifyResult( this, convertError( errResult ), resultVerifier, resolve, reject, savedHandleState );
                    };

                    context.succeed = ( result ) => {

                        var failError = new Error( 'encountered successful operation but expected failure - result: ' + result );
                        failError.result = result;

                        reject( failError );
                    };

                    context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( this );

                    let callback = createFailCallback( reject );

                    runHandler( this, context, callback, reject );
                });
            });

        addVerify( promise );

        addCleanup( promise, this );

        return promise;
    }

    expectError( resultVerifier ) {

        let promise = resolveHandler( this )
            .then( () => {

                // need to do a nested promise because mocha injects a timer between the start of the
                // promise and .then()
                let savedHandleState = lambdaLeak.capture();

                return new Promise( ( resolve, reject ) => {

                    let context = createCallbackContext( this, reject );

                    context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( this );

                    var callback = ( err, result ) => {

                        if( err ) {

                            return verifyResult( this, convertError( err ), resultVerifier, resolve, reject, savedHandleState );
                        }

                        let failError = new Error( 'expecting error but got result: ' + result );
                        failError.result = result;

                        reject( failError );
                    }

                    runHandler( this, context, callback, reject );
                });
            });

        addVerify( promise );

        addCleanup( promise, this );

        return promise;
    }

    expectResult( resultVerifier ) {

        let promise = resolveHandler( this )
            .then( () => {

                // need to do a nested promise because mocha injects a timer between the start of the
                // promise and .then()
                let savedHandleState = lambdaLeak.capture();

                return new Promise( ( resolve, reject ) => {

                    let context = createCallbackContext( this, reject );

                    context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( this );

                    let callback = ( err, result ) => {

                        if( err ) {

                            err = convertError( err );

                            let failError = new Error( 'expecting result but error was thrown  - cause: ' + err.message  );
                            failError.cause = err;

                            return reject( failError );
                        }

                        verifyResult( this, result, resultVerifier, resolve, reject, savedHandleState );
                    }

                    runHandler( this, context, callback, reject );
                });
            });

        addVerify( promise );

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

LambdaTesterModule.noVersionCheck = function() {

    checkVersion = false;
}

// Set the task root to the app's root if not already set
process.env.LAMBDA_TASK_ROOT = require( 'app-root-path' );

if( !process.env.LAMBDA_TESTER_NO_ENV ) {

    // configure env varaiables
    require( 'dotenv' ).config( { silent: true } );
}

module.exports = LambdaTesterModule;
