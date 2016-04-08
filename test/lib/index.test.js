'use strict';

const expect = require( 'chai' ).expect;

const sinon = require( 'sinon' );

const LambdaTester = require( '../../lib/index' );

const LAMBDA_SIMPLE_SUCCEED = function( event, context ) { context.succeed( 'ok' ); };

const LAMBDA_SIMPLE_SUCCEED_DONE = function( event, context ) { context.done( null, 'ok' ); };

const LAMBDA_SIMPLE_FAIL = function( event, context ) { context.fail( new Error( 'bang' ) ); };

const LAMBDA_SIMPLE_FAIL_DONE = function( event, context ) { context.done( new Error( 'bang' ) ); };

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

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'without verifier via context.done()', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED_DONE );

                var returnValue = tester.expectSucceed();

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'with verifier', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_SUCCEED );

                var verifier = sinon.stub();

                var returnValue = tester.expectSucceed( verifier );

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue
                    .then( function() {

                        expect( verifier.calledOnce ).to.be.true;
                        expect( verifier.withArgs( 'ok' ).calledOnce ).to.be.true;
                    });
            });

            it( 'with .verify()', function() {

                var done = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed()
                    .verify( done )
                    .then( function() {

                        expect( done.calledOnce ).to.be.true;
                        expect( done.withArgs().calledOnce ).to.be.true;
                    });
            })

            it( 'with verifier that returns a promise', function() {

                let value = 1;

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed( function( result ) {

                        return Promise.resolve()
                            .then( function() {

                                return new Promise( function( resolve, reject ) {

                                    setTimeout( function() { value++; resolve(); }, 10 );
                                });
                            });
                    })
                    .then( function() {

                        expect( value ).to.equal( 2 );
                    });
            });

            it( 'fail: when context.fail() is called', function() {

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectSucceed()
                    .then(
                        function() {

                            throw new Error( 'should not succeed' );
                        },
                        function( err ) {

                            expect( err.message ).to.equal( 'encountered error but expected the handler to succeed' );
                            expect( err.cause.message ).to.equal( 'bang' );
                        });
            });

            it( 'fail: when verifier fails with .verify', function() {

                var done = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectSucceed( function( result ) {

                        throw new Error( 'bang' );
                    })
                    .verify( done )
                    .then( function() {

                            expect( done.calledOnce ).to.be.true;

                            expect( done.firstCall.args[0] ).to.be.an( 'Error' );
                        }
                    );
            });
        });

        describe( '.expectFail', function() {

            it( 'without verifier', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_FAIL );

                var returnValue = tester.expectFail();

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'without verifier via context.done()', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_FAIL_DONE );

                var returnValue = tester.expectFail();

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'with verifier', function() {

                var tester = LambdaTester( LAMBDA_SIMPLE_FAIL );

                var verifier = function( err ) {};

                var returnValue = tester.expectFail( verifier );

                expect( returnValue ).to.be.instanceof( Promise );
                expect( returnValue.verify ).to.be.a( 'function' );

                return returnValue;
            });

            it( 'with .verify()', function() {

                var done = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectFail()
                    .verify( done )
                    .then( function() {

                        expect( done.calledOnce ).to.be.true;
                        expect( done.withArgs().calledOnce ).to.be.true;
                    });
            });

            it( 'with verifier that returns a promise', function() {

                let value = 1;

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectFail( function( result ) {

                        return Promise.resolve()
                            .then( function() {

                                return new Promise( function( resolve, reject ) {

                                    setTimeout( function() { value++; resolve(); }, 10 );
                                });
                            });
                    })
                    .then( function() {

                        expect( value ).to.equal( 2 );
                    });
            });

            it( 'fail: when context.succeed() is called', function() {

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectFail()
                    .then(
                        function() {

                            throw new Error( 'should not succeed' );
                        },
                        function( err ) {

                            expect( err.message ).to.equal( 'encountered successful operation but expected failure' );
                            expect( err.result ).to.equal( 'ok' );
                        });
            });

            it( 'fail: when verifier fails with .verify', function() {

                var done = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectFail( function( err ) {

                        throw new Error( 'boom' );
                    })
                    .verify( done )
                    .then( function() {

                            expect( done.calledOnce ).to.be.true;

                            expect( done.firstCall.args[0] ).to.be.an( 'Error' );
                        }
                    );
            });
        });
    });
});
