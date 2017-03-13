'use strict';

const contextBuilder = require( './context_builder' );

const lambdaLeak = require( 'lambda-leak' );

const utils = require( './utils' );

const DEFAULT_TIMEOUT = 3000; // s3

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

    if( !capturedState ) {

        return;
    }

    let handleDifference = capturedState.getDifferenceInHandles();

    if( handleDifference.length > 0 ) {

        let err = new Error( 'Potential handle leakage detected' );
        err.handles = handleDifference;

        throw err;
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

            if( err ) {

                return err;
            }

            throw new FailError( 'expecting error but got result', null, handlerResult.result );

        case 'context.succeed':

            if( !err ) {

                return handlerResult.result;
            }

            throw new FailError( 'encountered error but expected the handler to succeed', err );

        //case 'callback':
        default:

            if( expectedOutcome === 'error' ) {

                if( err ) {

                    return err;
                }

                throw new FailError( 'expecting error but got result', null, handlerResult.result );
            }
            else {

                if( !err ) {

                    return handlerResult.result;
                }

                throw new FailError( 'expecting result but error was thrown', err );
            }
    }
}


class LambdaRunner {

    constructor( method, verifier, options ) {

        let methodParts = method.split( ':', 2 );

        this.method = methodParts[0];
        this.expectedOutcome = methodParts[1];

        this.verifier = verifier;

        this.timeout = options.timeout || DEFAULT_TIMEOUT;
        this.enforceTimeout = (options.timeout > 0);
        this.wantLeakDetection = options.checkForHandleLeak || false;
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

        let capturedState = this.wantLeakDetection ? lambdaLeak.capture() : null;

        let startTime = Date.now();

        return new Promise( ( resolve, reject ) => {

            try {

                this._validate();

                let context = this._createContext( resolve, { startTime } );

                let callback = ( err, result ) => resolve( { method: 'callback', err, result } );

                handler( this.event, context, callback );
            }
            catch( error ) {

                reject( error );
            }
        })
        .then( ( handlerResult ) => {

            let execTime = (Date.now() - startTime);

            if( this.enforceTimeout && (execTime > this.timeout) ) {

                throw new Error( `handler timed out - execution time: ${execTime}ms, timeout after: ${this.timeout}ms` );
            }

            detectLeaks( capturedState );

            let result = processOutcome( this.method, this.expectedOutcome, handlerResult );

            if( this.verifier ) {

                return this.verifier( result, { execTime } );
            }
        });
    }

    _validate() {

        if( !this.method ) {

            throw new Error( 'method not set' );
        }

        if( !this.event ) {

            throw new Error( 'event not set' );
        }

        if( !this.context ) {

            throw new Error( 'context not set' );
        }
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
