'use strict';

var DEFAULT_TIMEOUT = 3000; // s3

function createContext( tester ) {

    return {

        done: function( err, result ) {

                if( err ) {

                    return this.fail( err );
                }

                return this.succeed( result );
            }
    };
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

function verifyResult( tester, result, verifier, resolve, reject ) {

    try {

        let execTime = (Date.now() - tester._startTime);

        if( tester._enforceTimeout && (execTime >= tester._timeout) ) {

            throw new Error( 'handler timed out - execution time: ' + execTime + 'ms, timeout after: ' + tester._timeout + 'ms' );
        }

        resolve( verifier( result, { execTime } ) );
    }
    catch( err ) {

        reject( err );
    }
}

class LambdaTester {

    constructor( handler ) {

        this._handler = handler;

        this._event = {};

        this._timeout = DEFAULT_TIMEOUT;
    }

    event( evt ) {

        if( !evt ) {

            throw new Error( 'missing event' );
        }

        this._event = evt;

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

        var context = createContext( this );

        var self = this;

        let succeedPromise = new Promise( function( resolve, reject ) {

            context.succeed = function( result ) {

                // if memory is beyond, throw exception


                verifyResult( self, result, resultVerifier, resolve, reject );
            };

            context.fail = function( err ) {

                var failError = new Error( 'encountered error but expected the handler to succeed' );
                failError.cause = err;

                reject( failError );
            };

            context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( self );

            let callback = createFailCallback( reject );

            runHandler( self, context, callback, reject );
        });

        // support for v1 users
        addLegecyVerify( succeedPromise );

        return succeedPromise;
    }

    expectFail( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        var context = createContext( this );

        var self = this;

        let failPromise = new Promise( function( resolve, reject ) {

            context.fail = function( errResult ) {

                verifyResult( self, errResult, resultVerifier, resolve, reject );
            };

            context.succeed = function( result ) {

                var failError = new Error( 'encountered successful operation but expected failure' );
                failError.result = result;

                reject( failError );
            };

            context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( self );

            let callback = createFailCallback( reject );

            runHandler( self, context, callback, reject );
        });

        // support for v1 users
        addLegecyVerify( failPromise );

        return failPromise;
    }

    expectError( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        var self = this;

        return new Promise( function( resolve, reject ) {

            var context = createCallbackContext( self, reject );

            context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( self );

            var callback = function( err, result ) {

                if( err ) {

                    return verifyResult( self, err, resultVerifier, resolve, reject );
                }

                var failError = new Error( 'expecting error' );
                failError.result = result;

                reject( failError );
            }

            runHandler( self, context, callback, reject );
        });
    }

    expectResult( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        var self = this;

        return new Promise( function( resolve, reject ) {

            var context = createCallbackContext( self, reject );

            context.getRemainingTimeInMillis = createGetRemainingTimeInMillis( self );

            var callback = function( err, result ) {

                if( err ) {

                    var failError = new Error( 'expecting result' );
                    failError.cause = err;

                    return reject( failError );
                }

                verifyResult( self, result, resultVerifier, resolve, reject );
            }

            runHandler( self, context, callback, reject );
        });
    }
}

function LambdaTesterModule( handler ) {

    if( !handler ) {

        throw new Error( 'missing handler' );
    }

    return new LambdaTester( handler );
}

// Set the task root to the app's root if not already set
process.env.LAMBDA_TASK_ROOT = require( 'app-root-path' );

module.exports = LambdaTesterModule;
