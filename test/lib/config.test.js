'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const sinon = require( 'sinon' );

const fs = require( 'fs' );

const freshy = require( 'freshy' );

const appRoot = require( 'app-root-path' );

const MODULE_PATH = '../../lib/config';

describe( 'lib/config', function() {

    beforeEach( function() {

        // make sure we have an artifact free version each time
        freshy.unload( MODULE_PATH );

        try {

            fs.unlinkSync( appRoot + '/.lambda-tester.json' );
        }
        catch( err ) {

            // ignore
        }
    });

    afterEach( function() {

        try {

            fs.unlinkSync( appRoot + '/.lambda-tester.json' );
        }
        catch( err ) {

            // ignore
        }
    });

    it( 'no .lambda-tester.json', function() {

        let config = require( MODULE_PATH );

        expect( config.loaded ).to.be.false;
    });

    it( 'user .lambda-tester.json', function() {

        fs.writeFileSync( appRoot + '/.lambda-tester.json', JSON.stringify( { whatever: 1234 } ) );

        let config = require( MODULE_PATH );

        expect( config.loaded ).to.be.true;
        expect( config.whatever ).to.equal( 1234 );
    });

    it( 'user .lambda-tester.json but not json', function() {

        fs.writeFileSync( appRoot + '/.lambda-tester.json', 'this is a string' );

        let config = require( MODULE_PATH );

        expect( config.loaded ).to.be.false;
    });

    it( 'user .lambda-tester.json but not json object', function() {

        fs.writeFileSync( appRoot + '/.lambda-tester.json', JSON.stringify( "this is a json string" ) );

        let config = require( MODULE_PATH );

        expect( config.loaded ).to.be.false;
    });
});
