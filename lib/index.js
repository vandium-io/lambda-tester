'use strict';

const semver = require('semver');

const utils = require( './utils' );

const config = require( './config' );

const eventTypes = require( './event_types' );

const SUPPORTED_NODE_RANGE = '8.10.0 - 8.999.0';

var checkForHandleLeak = false;

var checkVersion = utils.parseBoolean( process.env.LAMBDA_TESTER_NODE_VERSION_CHECK || 'true' );

function doVersionCheck() {

    if( !checkVersion ) {

        return;
    }

    if( !semver.satisfies( process.versions.node, SUPPORTED_NODE_RANGE ) ) {

        throw new Error( 'Please test with node.js versions: ' + SUPPORTED_NODE_RANGE );
    }
}

function LambdaTesterModule( handler ) {

    doVersionCheck();

    return new eventTypes.LegacyTester()
        .checkForLeaks( checkForHandleLeak )
        .handler( handler );
}

LambdaTesterModule.api = function() {

    return new eventTypes.APITester()
        .checkForLeaks( checkForHandleLeak );
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
