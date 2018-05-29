'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const sinon = require( 'sinon' );

const LambdaRunner = require( '../../lib/runner' );

describe( 'lib/runner', function() {

    describe( 'LambdaRunner', function() {

        describe( 'constructor', function() {

            it( 'using defaults', function() {

                let instance = new LambdaRunner( 'callback:result' );

                expect( instance.method ).to.equal( 'callback' );
                expect( instance.expectedOutcome ).to.equal( 'result' );
                expect( instance.verifier ).to.be.undefined;
                expect( instance.timeout ).to.equal( 3000 );
                expect( instance.enforceTimeout ).to.be.false;
                expect( instance.wantLeakDetection ).to.be.false;
            });

            it( 'using specified options and verifier', function() {

                let verifier = function() {};

                let instance = new LambdaRunner( 'callback:result', verifier, { timeout: 10000, checkForHandleLeak: true } );

                expect( instance.method ).to.equal( 'callback' );
                expect( instance.expectedOutcome ).to.equal( 'result' );
                expect( instance.verifier ).to.equal( verifier );
                expect( instance.timeout ).to.equal( 10000 );
                expect( instance.enforceTimeout ).to.be.true;
                expect( instance.wantLeakDetection ).to.be.true;
            });
        });

        describe( '.withEvent', function() {

            it( 'normal operation', function() {

                let instance = new LambdaRunner( 'callback:result', null, {} );

                expect( instance.event ).to.not.exist;

                let returnValue = instance.withEvent( {} );

                expect( returnValue ).to.equal( instance );
                expect( instance.event ).to.exist;
                expect( instance.event ).to.eql( {} );
            });
        });

        describe( '.withContext', function() {

            it( 'normal operation', function() {

                let instance = new LambdaRunner( 'callback:result', null, {} );

                expect( instance.context ).to.not.exist;

                let returnValue = instance.withContext( { whatever: 1234} );

                expect( returnValue ).to.equal( instance );

                expect( instance.context ).to.exist;
                expect( instance.context.functionName ).to.exist;
                expect( instance.context.functionVersion ).to.exist;
                expect( instance.context.memoryLimitInMB ).to.exist;
                expect( instance.context.logGroupName ).to.exist;
                expect( instance.context.logStreamName ).to.exist;
                expect( instance.context.invokedFunctionArn ).to.exist;
                expect( instance.context.invokeid ).to.exist;
                expect( instance.context.awsRequestId ).to.exist;

                expect( instance.context.whatever ).to.equal( 1234 );
            });
        });

        describe( '.run', function() {

            it( 'successful callback:result using defaults', function() {

                let instance = new LambdaRunner( 'callback:result', null, {} ).withEvent( {} );

                return instance.run( (event, context, callback) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        callback( null, 'ok' );
                    });
            });

            it( 'successful callback:result with event, context, and verifier', function() {

                let verifier = sinon.stub();

                let instance = new LambdaRunner( 'callback:result', verifier, { checkForHandleLeak: true } )
                    .withEvent( { answer: 42 } )
                    .withContext( { whatever: true } );

                return instance.run( (event, context, callback) => {

                        expect( event ).to.eql( { answer: 42 } );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;
                        expect( context.whatever ).to.be.true;

                        callback( null, 'ok' );
                    })
                    .then( () => {

                        expect( verifier.calledOnce ).to.be.true;
                        expect( verifier.firstCall.args[0] ).to.equal( 'ok' );
                        expect( verifier.firstCall.args[1].execTime ).to.exist;
                    });
            });

            it( 'successful callback:error using defaults', function() {

                let instance = new LambdaRunner( 'callback:error', null, {} ).withEvent( {} );

                return instance.run( (event, context, callback) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        callback( new Error( 'bang' ) );
                    });
            });

            it( 'successful Promise.resolve using defaults', function() {

                let instance = new LambdaRunner( 'Promise.resolve', null, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        return Promise.resolve( 'ok' );
                    });
            });

            it( 'successful Promise.resolve with event, context, and verifier', function() {

                let verifier = sinon.stub();

                let instance = new LambdaRunner( 'Promise.resolve', verifier, { checkForHandleLeak: true } )
                    .withEvent( { answer: 42 } )
                    .withContext( { whatever: true } );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( { answer: 42 } );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;
                        expect( context.whatever ).to.be.true;

                        return Promise.resolve( 'ok' );
                    })
                    .then( () => {

                        expect( verifier.calledOnce ).to.be.true;
                        expect( verifier.firstCall.args[0] ).to.equal( 'ok' );
                        expect( verifier.firstCall.args[1].execTime ).to.exist;
                    });
            });

            it( 'successful Promise.reject using defaults', function() {

                let instance = new LambdaRunner( 'Promise.reject', null, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        return Promise.reject( new Error( 'bang' ) );
                    });
            });

            it( 'successful context.succeed using defaults', function() {

                let instance = new LambdaRunner( 'context.succeed', null, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        context.succeed( 'ok' );
                    });
            });

            it( 'successful context.succeed using defaults, handler calling done', function() {

                let instance = new LambdaRunner( 'context.succeed', null, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        context.done( null, 'ok' );
                    });
            });

            it( 'successful context.fail using defaults', function() {

                let instance = new LambdaRunner( 'context.fail', null, { timeout: 3000 } ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 2900 );

                        context.fail( new Error( 'bang' ) );
                    });
            });

            it( 'successful context.fail using defaults, handler calling done', function() {

                let instance = new LambdaRunner( 'context.fail', null, { timeout: 3000 } ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 2900 );

                        context.done( new Error( 'bang' ) );
                    });
            });

            it( 'successful context.fail using defaults, error is a string', function() {

                let verifier = sinon.stub();

                let instance = new LambdaRunner( 'context.fail', verifier, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        context.fail( 'bang' );
                    })
                    .then( () => {

                        expect( verifier.calledOnce ).to.be.true;
                        expect( verifier.firstCall.args[0].constructor.name ).to.equal( 'Error' );
                        expect( verifier.firstCall.args[0].message ).to.equal( 'bang' );
                    });
            });

            it( 'fail when context.fail requested and context.succeed called', function() {

                let instance = new LambdaRunner( 'context.fail', null, {} ).withEvent( {} );

                return instance.run( (event, context) => {

                        expect( event ).to.eql( {} );
                        expect( context ).to.exist;
                        expect( context.functionName ).to.exist;

                        expect( context.getRemainingTimeInMillis() ).to.be.above( 0 );

                        context.succeed( 'ok' );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.equal( 'context.succeed() called instead of context.fail()' );
                        }
                    );
            });

            it( 'fail when timeout occurs', function() {

                let instance = new LambdaRunner( 'context.fail', null, { timeout: 1000 } );

                return instance.run( (event, context, callback) => {

                        setTimeout( () => {

                            callback( null, 'ok' );

                        }, 1010 );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.contain( 'timeout after: 1000ms' );
                        }
                    );
            });

            it( 'fail when callback used, expects a result but error is passed', function() {

                let instance = new LambdaRunner( 'callback:result', null, {} );

                return instance.run( (event, context, callback) => {

                        callback( new Error( 'bang' ) );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            // Issue #19
                            expect( err.message ).to.equal( 'bang' );
                        }
                    );
            });

            it( 'fail when callback used, expects an error but result is passed', function() {

                let instance = new LambdaRunner( 'callback:error', null, {} );

                return instance.run( (event, context, callback) => {

                        callback( null, 'ok' );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.equal( 'expecting error but got result' );
                        }
                    );
            });

            it( 'fail when error thrown during execution', function() {

                let instance = new LambdaRunner( 'callback:error', null, {} );

                return instance.run( (event, context, callback) => {

                        throw new Error( 'bang' );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.equal( 'bang' );
                        }
                    );
            });

            it( 'fail when leak is detected', function() {

                let instance = new LambdaRunner( 'callback:result', null, { checkForHandleLeak: true } );

                return instance.run( (event, context, callback) => {

                        setTimeout( ()=>{}, 100 );

                        callback( null, 'ok' );
                    })
                    .then(
                        () => {

                            throw new Error( 'should not resolve' );
                        },
                        (err) => {

                            expect( err.message ).to.equal( 'Potential handle leakage detected' );
                        }
                    );
            });
        });
    });
});
