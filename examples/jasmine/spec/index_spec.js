'use strict'

const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'index', function() {

    describe( '.handler', function() {

        it( 'normal operation', function( done ) {

            return LambdaTester( myHandler )
                .event( { name: 'Fred' } )
                .expectResult( function( result ) {

                    expect( result ).toEqual( 'Fred' );
                })
                .verify( done );
        });
    });
});
