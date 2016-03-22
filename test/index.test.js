var expect = require( 'chai' ).expect;

var LambdaTester = require( '../lib/index' );

var index = require( '../index' );

describe( 'index', function() {

    it( 'returns LambdaTester type', function() {

        expect( index ).to.equal( LambdaTester );
    });
});
