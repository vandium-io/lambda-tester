'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const createTraceId = require( '../trace_id' );

describe( 'lib/xray/trace_id', function() {

    it( 'normal operation', function() {

        let traceId = createTraceId();

        let verifyRegEx = /(\w+)[=]([\w\-]+)\;?/g

        let rootMatch = verifyRegEx.exec( traceId );
        expect( rootMatch ).to.exist;
        expect( rootMatch[1] ).to.equal( 'Root' );
        expect( rootMatch[2].startsWith( '1-' ) ).to.be.true;
        expect( rootMatch[2].length ).to.equal( 35 );

        let parentMatch = verifyRegEx.exec( traceId );
        expect( parentMatch ).to.exist;
        expect( parentMatch[1] ).to.equal( 'Parent' );
        expect( parentMatch[2].length ).to.equal( 16 );

        let sampledMatch = verifyRegEx.exec( traceId );
        expect( sampledMatch ).to.exist;
        expect( sampledMatch[1] ).to.equal( 'Sampled' );
        expect( sampledMatch[2] ).to.equal( '1' );

        expect( verifyRegEx.exec( traceId ) ).to.be.null;
    });
});
