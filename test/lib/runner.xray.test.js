'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const sinon = require( 'sinon' );

const freshy = require( 'freshy' );

function unload() {

    freshy.unload( '../../lib/runner' );
    freshy.unload( '../../lib/xray')
    freshy.unload( 'aws-xray-sdk-core' );

    delete process.env._X_AMZN_TRACE_ID;
}

describe( 'lib/runner (xray)', function() {

    before( unload );

    after( unload );

    describe( 'LambdaRunner', function() {

        let LambdaRunner;

        let AWSXRay;

        before( function() {

            process.env.AWS_XRAY_DEBUG_MODE = true;
            LambdaRunner = require( '../../lib/runner' );


        });

        describe( '.run', function() {

            it( 'x-ray enabled', function() {

                let verifier = (result, additional ) => {

                    console.log( additional );
                };

                let instance = new LambdaRunner( 'callback:result', verifier, { xray: true } ).withEvent( {} );

                return instance.run( (event, context, callback) => {

                        AWSXRay = require( 'aws-xray-sdk-core' );

                        console.log( process.env.AWS_XRAY_DAEMON_ADDRESS );
                        console.log( process.env._X_AMZN_TRACE_ID );

                        let segment = AWSXRay.getSegment().addNewSubsegment( 'test-segment' );

                        segment.close();

                        callback( null, 'ok' );
                    });
            });
        });
    });
});
