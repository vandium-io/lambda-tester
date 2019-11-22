'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const LambdaRunner = require( '../runner' );

const freshy = require( 'freshy' );

function unload() {

    freshy.unload( '../runner' );
    freshy.unload( '../xray')
    freshy.unload( 'aws-xray-sdk-core' );

    delete process.env._X_AMZN_TRACE_ID;
}

describe( 'lib/runner (xray)', function() {

    before( unload );

    after( unload );

    describe( 'LambdaRunner', function() {

        let AWSXRay;

        afterEach( function() {

            freshy.unload( 'aws-xray-sdk-core' );
        });

        describe( '.run', function() {

            it( 'x-ray enabled', function() {

                let verifier = (result, additional ) => {

                    expect( additional.xray ).to.exist;
                    expect( additional.xray.segments ).to.exist;
                    expect( Array.isArray( additional.xray.segments ) ).to.be.true;
                    expect( additional.xray.segments.length ).to.equal( 1 );

                    let segment = additional.xray.segments[0];
                    expect( segment.name ).to.equal( 'test-segment' );
                    expect( segment.type ).to.equal( 'subsegment' );
                };

                let instance = new LambdaRunner( 'callback:result', verifier, { xray: true } ).withEvent( {} );

                return instance.run( (event, context, callback) => {

                        AWSXRay = require( 'aws-xray-sdk-core' );

                        let segment = AWSXRay.getSegment().addNewSubsegment( 'test-segment' );

                        segment.close();

                        callback( null, 'ok' );
                    });
            });
        });
    });
});
