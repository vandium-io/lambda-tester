'use strict';

const contextBuilder = require( './context_builder' );

const lambdaLeak = require( 'lambda-leak' );

const utils = require( './utils' );

const DEFAULT_TIMEOUT = 3000; // s3

const XRAY_SETTLE_TIMEOUT = 20;

const xrayServer = require( './xray' );

function convertError( err ) {

    if( utils.isString( err ) ) {

        err = new Error( err );
    }

    return err;
}

class FailError extends Error {

    constructor( message, cause, result ) {

        super( message );

        this.cause = convertError( cause );
        this.result = result;
    }
}


function detectLeaks( capturedState ) {

    if( capturedState ) {

        let handleDifference = capturedState.getDifferenceInHandles();

        if( handleDifference.length > 0 ) {

            let err = new Error( 'Potential handle leakage detected' );
            err.handles = handleDifference;

            throw err;
        }
    }
}

function processOutcome( method, expectedOutcome, handlerResult ) {

    if( method !== handlerResult.method ) {

        throw new FailError( `${handlerResult.method}() called instead of ${method}()`,
                             handlerResult.err, handlerResult.result );
    }

    let err = convertError( handlerResult.err );

    switch( method ) {

        case 'context.fail':
        case 'Promise.reject':
            return err;

        case 'context.succeed':
        case 'Promise.resolve':
            return handlerResult.result;

        //case 'callback':
        default:

            if( expectedOutcome === 'error' ) {

                if( err ) {

                    return err;
                }

                throw new FailError( 'expecting error but got result', null, handlerResult.result );
            }
            else {

                if( err ) {

                    // re-throw error
                    throw err;
                }

                return handlerResult.result;
            }
    }
}

function startXRay( enabled ) {

    if( enabled ) {

        return xrayServer.start();
    }
    else {

        return Promise.resolve();
    }
}

function waitForXRayToSettle( resolve ) {

    let length = xrayServer.segments.length;

    setTimeout( () => {

        if( xrayServer.segments.length === length ) {

            // everything is most likely flushed
            return resolve();
        }

        // give it another shot
        waitForXRayToSettle( resolve );
    }, XRAY_SETTLE_TIMEOUT );
}

function waitForXRay( enabled ) {

    let promise;

    if( enabled ) {

        promise =  new Promise( waitForXRayToSettle );
    }
    else {

        promise = Promise.resolve();
    }

    return promise;
}

function stopXRay( err, result ) {

        return xrayServer.stop()
            .then( () => {

                if( err ) {

                    throw err;
                }

                return result;
            });
}

function runVerifier( verifier, result, additional ) {

    if( verifier.length === 3 ) {

        // async callback
        return new Promise( (resolve, reject) => {

            verifier( result, additional, (err,res) => {

                if( err ) {

                    return reject( err );
                }

                resolve( res );
            });
        });
    }
    else {

        // verifier is a sync function or Promise
        return verifier( result, additional );
    }
}

class LambdaRunner {

    constructor( method, verifier, options = {} ) {

        let methodParts = method.split( ':', 2 );

        this.method = methodParts[0];
        this.expectedOutcome = methodParts[1];

        this.verifier = verifier;

        this.timeout = options.timeout || DEFAULT_TIMEOUT;
        this.enforceTimeout = (options.timeout > 0);
        this.wantLeakDetection = options.checkForHandleLeak || false;
        this.xray = options.xray || false;
    }

    withEvent( event ) {

        this.event = event;

        return this;
    }

    withContext( context /*, wantCallback*/ ) {

        this.context = contextBuilder( context );

        return this;
    }

    run( handler ) {

        let capturedState;

        let startTime = Date.now();

        return Promise.resolve()
            .then( () => {

                return startXRay( this.xray );
            })
            .then( () => {

                // must capture after the first Promise.resolve() since mocha starts the timer afterwards
                if( this.wantLeakDetection ) {

                    capturedState = lambdaLeak.capture();
                }

                return new Promise( ( resolve, reject ) => {

                    try {

                        if( !this.context ) {

                            this.context = contextBuilder( {} );
                        }

                        let context = this._createContext( resolve, { startTime } );

                        let callback = ( err, result ) => resolve( { method: 'callback', err, result } );

                        const ret = handler( this.event, context, callback );

                        if( ret && ret.then && typeof(ret.then) === 'function' ) {

                            ret
                                .then((result) => {

                                    resolve( { method: 'Promise.resolve', err: null, result } )
                                },
                                (err) => {

                                    resolve( { method: 'Promise.reject', err, result: null } )
                                });
                        }
                    }
                    catch( error ) {

                        reject( error );
                    }
                })
        })
        .then( ( handlerResult ) => {

            let execTime = (Date.now() - startTime);

            if( this.enforceTimeout && (execTime > this.timeout) ) {

                throw new Error( `handler timed out - execution time: ${execTime}ms, timeout after: ${this.timeout}ms` );
            }

            detectLeaks( capturedState );

            let result = processOutcome( this.method, this.expectedOutcome, handlerResult );

            if( this.verifier ) {

                let additional = { execTime };

                if( this.xray ) {

                    additional.xray = { segments: xrayServer.segments };
                }

                return waitForXRay( this.xray )
                    .then( () => {

                        return runVerifier( this.verifier, result, additional );
                    });
            }
        })
        .then(

            (result) => {

                return stopXRay( null, result );
            },
            (err) => {

                return stopXRay( err );
            }
        );
    }

    _createContext( resolve, additional ) {

        let context = Object.assign( {}, this.context );

        context.fail = ( err ) => resolve( { method: 'context.fail', err } );
        context.succeed = ( result ) => resolve( { method: 'context.succeed', result } );
        context.done = ( err, result ) => resolve( { method: err ? 'context.fail' : 'context.succeed', err, result } );

        context.getRemainingTimeInMillis = () => {

                let remaining = this.timeout - (Date.now() - additional.startTime);

                return Math.max( 0, remaining );
            }

        return context;
    }
}

module.exports = LambdaRunner;
