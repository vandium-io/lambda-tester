'use strict';

const semver = require('semver');

const lambdaEventMock = require( 'lambda-event-mock' );

const LambdaRunner = require( './runner' );

const { isObject, isFunction, parseBoolean } = require( './utils' );

const States = require( './states' );

const config = require( './config' );

const DEFAULT_TIMEOUT = 0;

const SUPPORTED_NODE_RANGE = '10.0.0 - 10.999.0 || 12.0.0 - 12.999.0';

var checkForHandleLeak = false;

var checkVersion = parseBoolean( process.env.LAMBDA_TESTER_NODE_VERSION_CHECK || 'false' );

var strictMode = false;

function noop_func() {}

function doVersionCheck() {

    if( !checkVersion ) {

        return;
    }

    if( !semver.satisfies( process.versions.node, SUPPORTED_NODE_RANGE ) ) {

        throw new Error( 'Please test with node.js versions: ' + SUPPORTED_NODE_RANGE );
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

    promise.verify = (done) => {

            // done.fail for jasmine users
            return promise.then( done, done.fail || done );
        };

    return promise;
}

function addCleanup( promise, tester ) {

    let afterFunc = tester._afterFunc || noop_func;

    promise = promise.then(

        (result) => {

            afterFunc( result, true );

            return result;
        },
        (err) => {

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
            strict: strictMode,
            checkForHandleLeak,
        };
    }

    loadHandler( loaderFunc ) {

        this._loadHandler = loaderFunc;

        return this;
    }

    strict( enable = true ) {

        this.options.strict = enable;
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

        this.strict();

        return this._doExpectState( States.contextSucceed, resultVerifier );
    }

    expectFail( resultVerifier ) {

        this.strict();

        return this._doExpectState( States.contextFail, resultVerifier );
    }

    expectError( resultVerifier ) {

        const { strict } = this.options;

        return this._doExpectState( strict ? States.callbackError : States.error, resultVerifier );
    }

    expectResult( resultVerifier ) {

        const { strict } = this.options;

        return this._doExpectState( strict ? States.callbackResult : States.result, resultVerifier );
    }

    expectReject( resultVerifier ) {

        this.strict();
        return this._doExpectState( States.promiseReject, resultVerifier );
    }

    expectResolve( resultVerifier ) {

        this.strict();
        return this._doExpectState( States.promiseResolve, resultVerifier );
    }

    _doExpectState( expectedState, resultVerifier ) {

        let promise = resolveHandler( this )
            .then( ( handler ) => {

                return new LambdaRunner( expectedState, resultVerifier, this.options )
                        .withEvent( this._event )
                        .withContext( this._context )
                        .run( handler );

            });

        return addVerify( addCleanup( promise, this ) );
    }
}

function LambdaTesterModule( handler ) {

    return new LambdaTester( handler );
}

LambdaTesterModule.checkForResourceLeak = ( enable = true ) => {

    checkForHandleLeak = (enable === true);
    return LambdaTesterModule;
}

LambdaTesterModule.noVersionCheck = () => {

    checkVersion = false;
    return LambdaTesterModule;
}

LambdaTesterModule.enableVersionCheck = ( enable = true ) => {

    checkVersion = enable;
    return LambdaTesterModule;
}

LambdaTesterModule.isVersionCheck = () => {

    return checkVersion;
}

LambdaTesterModule.strict = (enable = true) => {

    strictMode = enable;
    return LambdaTesterModule;
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
