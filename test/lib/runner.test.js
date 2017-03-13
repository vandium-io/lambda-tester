'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const sinon = require( 'sinon' );

const LambdaRunner = require( '../../lib/runner' );

describe( 'lib/runner', function() {

    describe( 'LambdaRunner', function() {

        describe( 'constructor', function() {

            it( 'normal operation using defaults, not verifier', function() {

                let instance = new LambdaRunner( 'callback:result', null, {} );
            });
        });
    });
});
