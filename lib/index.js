'use strict';

const semver = require('semver');

const lambdaEventMock = require( 'lambda-event-mock' );

const LambdaRunner = require( './runner' );

const { isObject, isFunction, parseBoolean } = require( './utils' );

const config = require( './config' );

const DEFAULT_TIMEOUT = 0;

const SUPPORTED_NODE_RANGE = '8.10.0 - 8.999.0 || 10.0.0 - 10.999.0 || 12.0.0 - 12.999.0';

var checkForHandleLeak = false;

var checkVersion = parseBoolean( process.env.LAMBDA_TESTER_NODE_VERSION_CHECK || 'true' );

function noop_func() {}

function doVersionCheck() {

    if( !checkVersion ) {

        return;
    }

    if( !semver.satisfies( process.versions.node, SUPPORTED_NODE_RANGE ) ) {

        throw new Error( 'Please test with node.js versions: ' + SUPPORTED_NODE_RANGE );
    }
}

async function resolveHandler( tester ) {

    return new Promise( ( resolve, reject ) => {

        try {

            doVersionCheck();

            let handler = tester._handler;

            if( tester._loadHandler ) {

                handler = tester._loadHandler()
            }

            if( !handler ) {

                throw new Error( 'no handler specified or returned from loadHandler()' );
            }

            resolve( handler );
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

    return promise;
}

async function addCleanup( promise, tester ) {

    let afterFunc = tester._afterFunc || noop_func;

    promise = promise.then(

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

    return promise;
}

class LambdaTester {

    constructor( handler ) {

        this._handler = handler;

        this._context = {};

        this._event = {};

        this.options = {

            timeout: DEFAULT_TIMEOUT,
            enforceTimeout: false,
            checkForHandleLeak
        };
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

        // create using event mocks
        if( isFunction( evt ) ) {

            evt = evt( lambdaEventMock );
        }

        if( isObject( evt ) && !Array.isArray( evt )) {

            this._event = { ...evt };
        }
        else {

            this._event = evt;
        }

        return this;
    }

    context( ctx )  {

        // copy entire context
        this._context = { ...ctx };

        return this;
    }

    clientContext( clientContext ) {

        this._context = { ...this._context, clientContext };

        return this;
    }

    identity( cognitoIdentityId, cognitoIdentityPoolId ) {

        this._context = {

            ...this._context,

            identity: {

                cognitoIdentityId,
                cognitoIdentityPoolId
            }
        };

        return this;
    }

    timeout( seconds ) {

        this.options.timeout = seconds * 1000;
        this.options.enforceTimeout = true;

        return this;
    }

    xray() {

        this.options.xray = true;

        return this;
    }

    expectSucceed( resultVerifier ) {

        let promise = resolveHandler( this )
            .then( ( handler ) => {

                return new LambdaRunner( 'context.succeed', resultVerifier, this.options )
                        .withEvent( this._event )
                        .withContext( this._context )
                        .run( handler );
            });

        return addVerify( addCleanup( promise, this ) );
    }

    expectFail( resultVerifier ) {

        //let context =  contextBuilder( this._context );

        let promise = resolveHandler( this )
            .then( ( handler ) => {

                return new LambdaRunner( 'context.fail', resultVerifier, this.options )
                        .withEvent( this._event )
                        .withContext( this._context )
                        .run( handler );

            });

        return addVerify( addCleanup( promise, this ) );

    }

    expectError( resultVerifier ) {

        let promise = resolveHandler( this )
            .then( ( handler ) => {

                return new LambdaRunner( 'callback:error', resultVerifier, this.options )
                        .withEvent( this._event )
                        .withContext( this._context, true )
                        .run( handler );
            });

        return addVerify( addCleanup( promise, this ) );
    }

    expectResult( resultVerifier ) {

        let promise = resolveHandler( this )
            .then( ( handler ) => {

                return new LambdaRunner( 'callback:result', resultVerifier, this.options )
                        .withEvent( this._event )
                        .withContext( this._context, true )
                        .run( handler );

            });

        return addVerify( addCleanup( promise, this ) );
    }

    expectReject( resultVerifier ) {

        let promise = resolveHandler( this )
            .then( ( handler ) => {

                return new LambdaRunner( 'Promise.reject', resultVerifier, this.options )
                        .withEvent( this._event )
                        .withContext( this._context, true )
                        .run( handler );
            });

        return addVerify( addCleanup( promise, this ) );
    }

    expectResolve( resultVerifier ) {

        let promise = resolveHandler( this )
            .then( ( handler ) => {

                return new LambdaRunner( 'Promise.resolve', resultVerifier, this.options )
                        .withEvent( this._event )
                        .withContext( this._context, true )
                        .run( handler );

            });

        return addVerify( addCleanup( promise, this ) );
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
    return LambdaTesterModule;
}

LambdaTesterModule.isVersionCheck = function() {

    return checkVersion;
}

// Event mocks
LambdaTesterModule.mocks = lambdaEventMock;

// Set the task root to the app's root if not already set
process.env.LAMBDA_TASK_ROOT = require( 'app-root-path' );

if( !process.env.LAMBDA_TESTER_NO_ENV ) {

    let path = config.envFile || '.env';

    const isJson = path.endsWith('.json');
    // configure env variables
    if ( isJson ) {

      require( 'dotenv-json' )( { path } );
    }
    else {

      require( 'dotenv' ).config( { path } );
    }
}

module.exports = LambdaTesterModule;
