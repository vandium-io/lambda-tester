'use strict';

const LambdaRunner = require( './runner' );

const utils = require( './utils' );

const config = require( './config' );

const DEFAULT_TIMEOUT = 0;

const TARGET_NODE_VERSION = '6.10.1';

var checkForHandleLeak = false;

var checkVersion = utils.parseBoolean( process.env.LAMBDA_TESTER_NODE_VERSION_CHECK || 'true' );

function noop_func() {}

function doVersionCheck() {

    if( !checkVersion ) {

        return;
    }

    if( process.versions.node < TARGET_NODE_VERSION ) {

        throw new Error( 'Please test with node.js >= ' + TARGET_NODE_VERSION );
    }
    else if ( process.versions.node >= '7.0.0' ) {

        throw new Error( 'node.js 7.x is not currently supported, please test with an older version.' );
    }
}

function resolveHandler( tester ) {

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

function addCleanup( promise, tester ) {

    let afterFunc = tester._afterFunc || noop_func;

    promise =  promise.then(

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

LambdaTesterModule.isVersionCheck = function() {

    return checkVersion;
}

// Set the task root to the app's root if not already set
process.env.LAMBDA_TASK_ROOT = require( 'app-root-path' );

if( !process.env.LAMBDA_TESTER_NO_ENV ) {

    let path = config.envFile || '.env';

    // configure env varaiables
    require( 'dotenv' ).config( { path } );
}

module.exports = LambdaTesterModule;
