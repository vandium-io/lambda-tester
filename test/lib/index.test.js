'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const sinon = require( 'sinon' );

const fs = require( 'fs' );

const LambdaTester = require( '../../lib/index' );

const LAMBDA_LONG_TIMEOUT = 1100;

const LAMBDA_SIMPLE_SUCCEED = function( event, context ) {

    context.succeed( 'ok' );
};

const LAMBDA_SIMPLE_SUCCEED_DONE = function( event, context ) {

    context.done( null, 'ok' );
};

const LAMBDA_SUCCEED_LONG = function( event, context, callback ) {

    setTimeout( function() {

            context.succeed( 'ok' );
        }, LAMBDA_LONG_TIMEOUT );
}

const LAMBDA_SIMPLE_FAIL = function( event, context ) {

    context.fail( new Error( 'bang' ) );
};

const LAMBDA_SIMPLE_FAIL_DONE = function( event, context ) {

    context.done( new Error( 'bang' ) );
};

const LAMBDA_FAIL_LONG = function( event, context, callback ) {

    setTimeout( function() {

            context.fail( new Error( 'bang' ) );
        }, LAMBDA_LONG_TIMEOUT );
}


const LAMBDA_SIMPLE_CALLBACK_ERROR = function( event, context, callback ) {

    callback( new Error( 'bang' ) );
};

const LAMBDA_CALLBACK_ERROR_LONG = function( event, context, callback ) {

    setTimeout( function() {

            callback( new Error( 'bang' ) );
        }, LAMBDA_LONG_TIMEOUT );
}

const LAMBDA_SIMPLE_CALLBACK = function( event, context, callback ) {

    callback( null, 'ok' );
};

const LAMBDA_CALLBACK_LONG = function( event, context, callback ) {

    if( context.getRemainingTimeInMillis() === 0 ) {

        throw new Error( 'getRemainingTimeInMillis() is not working' );
    }

    setTimeout( function() {

            if( context.getRemainingTimeInMillis() !== 0 ) {

                return callback( new Error( 'remaining time should be 0' ) );
            }

            callback( null, 'ok' );
        }, LAMBDA_LONG_TIMEOUT );
}

const LAMBDA_THROWS = function( event, context, callback ) {

    throw new Error( 'something happened!' );
};


describe( 'lib/index', function() {

    describe( 'environment variables', function() {

        it( 'LAMBDA_TASK_ROOT', function() {

            expect( process.env.LAMBDA_TASK_ROOT ).to.exist;

            var path = require( 'app-root-path' ).toString();

            expect( process.env.LAMBDA_TASK_ROOT ).to.equal( path );

            // should be our root - let's try to get our package.json
            let stats = fs.statSync( process.env.LAMBDA_TASK_ROOT + '/package.json' );

            expect( stats.isFile() ).to.be.true;
        });
    });

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

            it( 'without verifier and timeout', function() {

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .timeout( 1 )
                    .expectSucceed();
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

            it( 'fail: when callback( null, result ) called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectSucceed( verifier )
                    .then(
                        function() {

                            throw new Error( 'should fail' );
                        },
                        function( err ) {

                            expect( err.message ).to.equal( 'callback called' );
                            expect( err.result ).to.equal( 'ok' );
                        }
                    );
            });

            it( 'fail: when callback( err ) called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectSucceed( verifier )
                    .then(
                        function() {

                            throw new Error( 'should fail' );
                        },
                        function( err ) {

                            expect( err.message ).to.equal( 'callback called with error parameter' );
                            expect( err.cause.message ).to.equal( 'bang' );
                        }
                    );
            });

            it( 'fail: when exception thrown inside handler', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_THROWS )
                    .expectSucceed( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'something happened!' );
                        }
                    );
            });

            it( 'fail: when time exceeds allocated time', function() {

                this.timeout( LAMBDA_LONG_TIMEOUT + 500 );

                return LambdaTester( LAMBDA_SUCCEED_LONG )
                    .timeout( 1 )
                    .expectSucceed()
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },
                        function( err ) {

                            expect( err.message ).to.contain( 'handler timed out - execution time:' );
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

            it( 'without verifier and timeout', function() {

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .timeout( 1 )
                    .expectFail();
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
            it( 'fail: when callback( null, result ) called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectFail( verifier )
                    .then(
                        function() {

                            throw new Error( 'should fail' );
                        },
                        function( err ) {

                            expect( err.message ).to.equal( 'callback called' );
                            expect( err.result ).to.equal( 'ok' );
                        }
                    );
            });

            it( 'fail: when callback( err ) called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectFail( verifier )
                    .then(
                        function() {

                            throw new Error( 'should fail' );
                        },
                        function( err ) {

                            expect( err.message ).to.equal( 'callback called with error parameter' );
                            expect( err.cause.message ).to.equal( 'bang' );
                        }
                    );
            });

            it( 'fail: when exception thrown inside handler', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_THROWS )
                    .expectFail( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'something happened!' );
                        }
                    );
            });

            it( 'fail: when time exceeds allocated time', function() {

                this.timeout( LAMBDA_LONG_TIMEOUT + 500 );

                return LambdaTester( LAMBDA_FAIL_LONG )
                    .timeout( 1 )
                    .expectFail()
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },
                        function( err ) {

                            expect( err.message ).to.contain( 'handler timed out - execution time:' );
                        }
                    );
            });
        });

        describe( '.expectError', function() {

            it( 'without verifier', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectError();
            });

            it( 'without verifier and timeout', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .timeout( 1 )
                    .expectError();
            });

            it( 'with verifier', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectError( function( err ) {

                        expect( err.message ).to.equal( 'bang' );
                    });
            });

            it( 'fail: when context.fail() called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectError( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'context.fail() called before callback' );
                        }
                    );
            });

            it( 'fail: when context.succeed() called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectError( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'context.succeed() called before callback' );
                        }
                    );
            });

            it( 'fail: when callback( null, result ) called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectError( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'expecting error' );
                            expect( err.result ).to.equal( 'ok' );
                        }
                    );
            });

            it( 'fail: when exception thrown inside handler', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_THROWS )
                    .expectError( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'something happened!' );
                        }
                    );
            });

            it( 'fail: when time exceeds allocated time', function() {

                this.timeout( LAMBDA_LONG_TIMEOUT + 500 );

                return LambdaTester( LAMBDA_CALLBACK_ERROR_LONG )
                    .timeout( 1 )
                    .expectError()
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },
                        function( err ) {

                            expect( err.message ).to.contain( 'handler timed out - execution time:' );
                        }
                    );
            });
        });

        describe( '.expectResult', function() {

            it( 'without verifier', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectResult();
            });

            it( 'without verifier and timeout', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .timeout( 1 )
                    .expectResult();
            });

            it( 'with verifier', function() {

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK )
                    .expectResult( function( result ) {

                        expect( result ).to.equal( 'ok' );
                    });
            });

            it( 'fail: when context.fail() called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_FAIL )
                    .expectResult( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'context.fail() called before callback' );
                        }
                    );
            });

            it( 'fail: when context.succeed() called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_SUCCEED )
                    .expectResult( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'context.succeed() called before callback' );
                        }
                    );
            });

            it( 'fail: when callback( err ) called', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_SIMPLE_CALLBACK_ERROR )
                    .expectResult( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'expecting result' );
                        }
                    );
            });

            it( 'fail: when exception thrown inside handler', function() {

                var verifier = sinon.stub();

                return LambdaTester( LAMBDA_THROWS )
                    .expectResult( verifier )
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },

                        function( err ) {

                            expect( verifier.called ).to.be.false;

                            expect( err.message ).to.equal( 'something happened!' );
                        }
                    );
            });

            it( 'fail: when time exceeds allocated time', function() {

                this.timeout( LAMBDA_LONG_TIMEOUT + 500 );

                return LambdaTester( LAMBDA_CALLBACK_LONG )
                    .timeout( 1 )
                    .expectResult()
                    .then(
                        function() {

                            throw new Error( 'should not work' );
                        },
                        function( err ) {

                            expect( err.message ).to.contain( 'handler timed out - execution time:' );
                        }
                    );
            });
        });
    });
});
