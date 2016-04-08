'use strict';

var expect = require( 'chai' ).expect;

var LambdaTester = require( '../../lib/index' );

var LAMBDA_SIMPLE_SUCCEED = function( event, context ) { context.succeed( 'ok' ); };

var LAMBDA_SIMPLE_SUCCEED_DONE = function( event, context ) { context.done( null, 'ok' ); };

var LAMBDA_SIMPLE_FAIL = function( event, context ) { context.fail( new Error( 'bang' ) ); };

var LAMBDA_SIMPLE_FAIL_DONE = function( event, context ) { context.done( new Error( 'bang' ) ); };

describe( 'lib/index', function() {

    describe( 'LambdaTester', function() {

        describe( 'constructor', function() {

            it( 'called without new', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );
            });

            it( 'called with new', function() {

                var tester = new LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );
            });

            it( 'fail: called without handler, without calling new', function() {

                expect( LambdaTester.bind() ).to.throw( 'missing handler' );
            });

            it( 'fail: called without handler, called with new', function() {

                try {

                    new LambdaTester();

                    throw new Error( 'should not get here' );
                }
                catch( err ) {

                    expect( err.message ).to.equal( 'missing handler' );
                }
            });
        });

        describe( '.event', function() {

            it( 'normal operation', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                expect( tester._event ).to.eql( {} );

                var returnValue = tester.event( { one: 1 } );

                expect( returnValue ).to.equal( tester );
                expect( tester._event ).to.eql( { one: 1 } );

                returnValue = tester.event( { two: 2 } );

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );
                expect( tester._event ).to.eql( { two: 2 } );
            });

            it( 'fail: event missing', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                expect( tester.event.bind( tester ) ).to.throw( 'missing event' );
            });
        });

        describe( '.expectSucceed', function() {

            it( 'without verifier', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                var returnValue = tester.expectSucceed();

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );

                expect( tester.verifyOperation ).to.equal( 'succeed' );
                expect( tester.resultVerifier ).to.not.exist;
            });

            it( 'with verifier', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                var verifier = function( result ) {};

                var returnValue = tester.expectSucceed( verifier );

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );

                expect( tester.verifyOperation ).to.equal( 'succeed' );
                expect( tester.resultVerifier ).to.equal( verifier );
            });
        });

        describe( '.expectFail', function() {

            it( 'without verifier', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                var returnValue = tester.expectFail();

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );

                expect( tester.verifyOperation ).to.equal( 'fail' );
                expect( tester.resultVerifier ).to.not.exist;
            });

            it( 'with verifier', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                var verifier = function( err ) {};

                var returnValue = tester.expectFail( verifier );

                expect( tester.constructor.name ).to.equal( 'LambdaTester' );

                expect( tester.verifyOperation ).to.equal( 'fail' );
                expect( tester.resultVerifier ).to.equal( verifier );
            });
        });

        describe( '.verify', function() {

            function createFailDone( expectedMessage, done ) {

                return function( err ) {

                    if( !err ) {

                        return done( new Error( 'expecting failure message: ' + expectedMessage ) );
                    }

                    expect( err.message ).to.equal( expectedMessage );
                    done();
                }
            }

            it( 'verify event and context with expectSucceed()', function( done ) {

                LambdaTester( function( event, context ) {

                        expect( event ).to.eql( { one: 1, two: 'two', '3': 'three' } );

                        expect( context.succeed ).to.be.a( 'function' );
                        expect( context.fail ).to.be.a( 'function' );
                        expect( context.done ).to.be.a( 'function' );

                        context.done();
                    })
                    .event( { one: 1, two: 'two', '3': 'three' } )
                    .expectSucceed()
                    .verify( done );
            });

            it( 'verify event and context with expectFail()', function( done ) {

                LambdaTester( function( event, context ) {

                        expect( event ).to.eql( { one: 1, two: 'two', '3': 'three' } );

                        expect( context.succeed ).to.be.a( 'function' );
                        expect( context.fail ).to.be.a( 'function' );
                        expect( context.done ).to.be.a( 'function' );

                        context.done( new Error( 'bang' ) );
                    })
                    .event( { one: 1, two: 'two', '3': 'three' } )
                    .expectFail()
                    .verify( done );
            });

            it( 'verify success with default event and no verifier', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed()
                    .verify( done );
            });

            it( 'verify success with default event and no verifier, context.done()', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_SUCCEED_DONE )
                    .expectSucceed()
                    .verify( done );
            });

            it( 'verify success with default event and verifier', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed( function( result ) {

                        expect( result ).to.equal( 'ok' );
                    })
                    .verify( done );
            });

            it( 'verify success with long running (500ms) handler', function( done ) {

                LambdaTester( function( event, context ) {

                        setTimeout( function() { context.succeed( 'ok'); }, 500 );
                    })
                    .expectSucceed( function( result ) {

                        expect( result ).to.equal( 'ok' );
                    })
                    .verify( done );
            });

            it( 'verify fail with default event and no verifier', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectFail()
                    .verify( done );
            });

            it( 'verify fail with default event and no verifier, context.done()', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_FAIL_DONE )
                    .expectFail()
                    .verify( done );
            });

            it( 'verify fail with default event and verifier', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectFail( function( err ) {

                        expect( err ).to.be.an.instanceof( Error );
                        expect( err.message ).to.equal( 'bang' );
                    })
                    .verify( done );
            });

            it( 'verify fail with long running (500ms) handler', function( done ) {

                LambdaTester( function( event, context ) {

                        setTimeout( function() { context.fail( new Error( 'not ok' ) ); }, 500 );
                    })
                    .expectFail( function( err ) {

                        expect( err.message ).to.equal( 'not ok' );
                    })
                    .verify( done );
            });

            it( 'fail: default event, succeed expected, fail called, no verifier', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectSucceed()
                    .verify( createFailDone( 'encountered error but expected the handler to succeed', done ) );
            });

            it( 'fail: default event, fail expected, succeed called, no verifier', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectFail()
                    .verify( createFailDone( 'encountered successful operation but expected failure', done ) );
            });

            it( 'fail: default event, success expected, verifier fails', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed( function( result ) {

                        expect( result ).to.equal( 'good' );
                    })
                    .verify( function( err )  {

                        expect( err ).to.exist;
                        expect( err.message ).to.equal( "expected 'ok' to equal 'good'" );

                        done();
                    });
            });

            it( 'fail: default event, fail expected, verifier fails', function( done ) {

                LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectFail( function( err ) {

                        expect( err ).to.be.an.instanceof( Error );
                        expect( err.message ).to.equal( 'error' );
                    })
                    .verify( function( err )  {

                        expect( err ).to.exist;
                        expect( err.message ).to.equal( "expected 'bang' to equal 'error'" );

                        done();
                    });
            });

            it( 'fail: done is not supplied', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed();

                expect( tester.verify.bind( tester ) ).to.throw( 'missing callback' );
            });

            it( 'fail: expectSucceed() or expectFail() not called', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                expect( tester.verify.bind( tester, function( err ) {} ) ).to.throw( 'call expectSucceed() or expectFailure() before calling verify' );
            });

            it( 'fail: unknown verify operation', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                tester.verifyOperation = 'special';

                expect( tester.verify.bind( tester, function( err ) {} ) ).to.throw( 'unknown operation: special' );
            });
        });
    });
});
