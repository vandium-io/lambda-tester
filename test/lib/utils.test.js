'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const utils = require(  '../../lib/utils' );

describe( 'lib/utils', function() {

    describe( '.createLogStreamName', function() {

        it( 'without date', function() {

            let name = utils.createLogStreamName( '$LATEST' );

            expect( name.length ).to.equal( 52 );
            expect( name ).to.contain( '[$LATEST]' );
        });


        it( 'with date (month < 10 and day < 10)', function() {

            let d = new Date( 2000, 0, 1 );

            let name = utils.createLogStreamName( '$LATEST', d );

            expect( name.substr( 0, 20) ).to.equal( '2000/01/01/[$LATEST]' );

            let name2 = utils.createLogStreamName( '$LATEST', d );

            expect( name2.substr( 0, 20) ).to.equal( '2000/01/01/[$LATEST]' );
        });

        it( 'with date (month >= 10 and day >= 10)', function() {

            let d = new Date( 2000, 10, 10 );

            let name = utils.createLogStreamName( '$LATEST', d );

            expect( name.substr( 0, 20) ).to.equal( '2000/11/10/[$LATEST]' );

            let name2 = utils.createLogStreamName( '$LATEST', d );

            expect( name2.substr( 0, 20) ).to.equal( '2000/11/10/[$LATEST]' );
        });
    });

    describe( '.createFunctionArn', function() {


        after( function() {

            delete process.env.AWS_REGION;
        });

        it( 'without region', function() {

            let arn = utils.createFunctionArn( 'myLambda1' );

            expect( arn ).to.equal( 'arn:aws:lambda:us-east-1:999999999999:function:myLambda1' );
        });

        it( 'with AWS_REGION env set', function() {

            process.env.AWS_REGION = 'us-west-1';

            let arn = utils.createFunctionArn( 'myLambda2' );

            expect( arn ).to.equal( 'arn:aws:lambda:us-west-1:999999999999:function:myLambda2' );
        });
    });

    describe( '.createId', function() {

        it( 'normal operation', function() {

            expect( utils.createId().length ).to.equal( 36 );
        });
    });
});
