'use strict';

const contextBuilder = require( './context_builder' );

const utils = require( './utils' );

const DEFAULT_TIMEOUT = 3000; // s3

function convertError( err ) {

    if( utils.isString( err ) ) {

        err = new Error( err );
    }

    return err;
}

class LambdaRunner {

    constructor( options, resolve, reject, savedHandleState ) {

        this.timeout = options.timeout || DEFAULT_TIMEOUT;
        this.enforceTimeout = (options.timeout > 0);
        this.wantLeakDetection = options.checkForHandleLeak || false;

        this.resolve = resolve;
        this.reject = reject;
        this.savedHandleState = savedHandleState;
    }

    withEvent( event ) {

        this.event = event;

        return this;
    }

    withContext( context, wantCallback ) {

        this.context = contextBuilder( context );

        if( wantCallback ) {

            this.context.succeed = ( result ) => {

                    var failError = new Error( 'context.succeed() called before callback' );
                    failError.result = result;

                    this.reject( failError );
                };

            this.context.fail = ( err ) => {

                    err = convertError( err );

                    var failError = new Error( 'context.fail() called before callback' );
                    failError.cause = err;

                    this.reject( failError );
                };
        }

        this.context.getRemainingTimeInMillis = () => {

            let remaining = this.timeout - (Date.now() - this.startTime);

            return Math.min( 0, remaining );
        }

        return this;
    }

    run( handler, callback ) {

        try {

            if( !this.event ) {

                throw new Error( 'event not initialized' );
            }

            if( !this.context ) {

                throw new Error( 'context not initialized' );
            }

            this.startTime = Date.now();

            handler( this.event, this.context, callback );
        }
        catch( err ) {

            this.reject( err );
        }
        finally {

            // clear state
            delete this.event;
            delete this.context;
        }
    }

    verifyResult( result, verifier ) {

        try {

            this._verifyTimeout();

            this._detectLeaks();

            if( !verifier ) {

                return this.resolve();
            }

            this.resolve( verifier( result, { execTime: this.execTime } ) );
        }
        catch( err ) {

            this.reject( err );
        }
    }

    _verifyTimeout() {

        if( !this.enforceTimeout ) {

            return;
        }

        let execTime = (Date.now() - this.startTime);

        if( execTime > this.timeout ) {

            throw new Error( `handler timed out - execution time: ${execTime}ms, timeout after: ${this.timeout}ms` );
        }
    }

    _detectLeaks() {

        if( !this.wantLeakDetection ) {

            return;
        }

        let handleDifference = this.savedHandleState.getDifferenceInHandles();

        if( handleDifference.length > 0 ) {

            let err = new Error( 'Potential handle leakage detected' );
            err.handles = handleDifference;

            throw err;
        }
    }
}

module.exports = LambdaRunner;
