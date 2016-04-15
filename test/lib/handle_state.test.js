'use strict';

const expect = require( 'chai' ).expect;

const handleState = require( '../../lib/handle_state' );

describe( 'lib/handle_state', function() {

    describe( 'ActiveHandleState', function() {

        describe( 'constructor', function() {

            it( 'normal operation', function() {

                let instance = handleState.capture();

                expect( instance.constructor.name ).to.equal( 'ActiveHandleState' );
                expect( instance.savedState ).to.exist;
                expect( instance.savedState ).to.be.an( 'Array' );
            });
        });

        describe( '.getDifferenceInHandles', function() {

            it( 'no change', function() {

                let instance = handleState.capture();

                let difference = instance.getDifferenceInHandles();

                expect( difference ).to.be.an( 'Array' );
                expect( difference.length ).to.equal( 0 );
            });

            it( 'resource left open', function() {

                let instance = handleState.capture();

                let timerId = setTimeout( function() {}, 100 );

                let difference = instance.getDifferenceInHandles();

                expect( difference ).to.be.an( 'Array' );
                expect( difference.length ).to.equal( 1 );

                clearTimeout( timerId );
            });
        });
    });
});
