'use strict';

const utils = require( '../utils' );

function noop_func() {}

const BaseTester = require( './base' );

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

class LegacyTester extends BaseTester {

    constructor() {

        super();
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

    expectSucceed( resultVerifier ) {

        return addVerify( addCleanup( super.expectSucceed( resultVerifier ), this ) );
    }

    expectFail( resultVerifier ) {

        return addVerify( addCleanup( super.expectFail( resultVerifier ), this ) );
    }

    expectError( resultVerifier ) {

        return addVerify( addCleanup( super.expectError( resultVerifier ), this ) );
    }

    expectResult( resultVerifier ) {

        return addVerify( addCleanup( super.expectResult( resultVerifier ), this ) );
    }

    _resolveHandler() {

        if( this._loadHandler ) {

            return this._loadHandler();
        }

        return super._resolveHandler();
    }
}

module.exports = LegacyTester;
