'use strict';

function createContext( tester ) {

    return {

        done: function( err, result ) {

                if( err ) {

                    return this.fail( err );
                }

                return this.succeed( result );
            }
    };
}

function createFailCallback( reject ) {

    return function( err, result ) {

            if( err ) {

                let failError = new Error( 'callback called with error parameter' );
                failError.cause = err;

                return reject( failError );
            }

            let failError = new Error( 'callback called' );
            failError.result = result;

            reject( failError );
        };
}

function createCallbackContext( tester, reject ) {

    let context = createContext( tester );

    context.succeed = function( result ) {

            var failError = new Error( 'context.succeed() called before callback' );
            failError.result = result;

            reject( failError );
        };

    context.fail = function( err ) {

            var failError = new Error( 'context.fail() called before callback' );
            failError.cause = err;

            reject( failError );
        };

    return context;
}

function addLegecyVerify( promise ) {

    promise.verify = function( done ) {

            return promise.then(
                function() {

                    done();
                },
                function( err ) {

                    done( err );
                }
            );
        }
}

function verifyResult( result, verifier, resolve, reject ) {

    try {

        resolve( verifier( result ) );
    }
    catch( err ) {

        reject( err );
    }
}

class LambdaTester {

    constructor( handler ) {

        this._handler = handler;

        this._event = {};
    }

    event( evt ) {

        if( !evt ) {

            throw new Error( 'missing event' );
        }

        this._event = evt;

        return this;
    }

    expectSucceed( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        var context = createContext( this );

        var self = this;

        let succeedPromise = new Promise( function( resolve, reject ) {

            context.succeed = function( result ) {

                verifyResult( result, resultVerifier, resolve, reject );
            };

            context.fail = function( err ) {

                var failError = new Error( 'encountered error but expected the handler to succeed' );
                failError.cause = err;

                reject( failError );
            };

            let callback = createFailCallback( reject );

            try {

                self._handler( self._event, context, callback );
            }
            catch( err ) {

                reject( err );
            }
        });

        // support for v1 users
        addLegecyVerify( succeedPromise );

        return succeedPromise;
    }

    expectFail( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        var context = createContext( this );

        var self = this;

        let failPromise = new Promise( function( resolve, reject ) {

            context.fail = function( errResult ) {

                verifyResult( errResult, resultVerifier, resolve, reject );
            };

            context.succeed = function( result ) {

                var failError = new Error( 'encountered successful operation but expected failure' );
                failError.result = result;

                reject( failError );
            };

            let callback = createFailCallback( reject );

            try {

                self._handler( self._event, context, callback );
            }
            catch( err ) {

                reject( err );
            }
        });

        // support for v1 users
        addLegecyVerify( failPromise );

        return failPromise;
    }

    expectError( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        var self = this;

        return new Promise( function( resolve, reject ) {

            var context = createCallbackContext( self, reject );

            var callback = function( err, result ) {

                if( err ) {

                    return verifyResult( err, resultVerifier, resolve, reject );
                }

                var failError = new Error( 'expecting error' );
                failError.result = result;

                reject( failError );
            }

            try {

                self._handler( self._event, context, callback );
            }
            catch( err ) {

                reject( err );
            }
        });
    }

    expectResult( resultVerifier ) {

        if( !resultVerifier ) {

            resultVerifier = function() {};
        }

        var self = this;

        return new Promise( function( resolve, reject ) {

            var context = createCallbackContext( self, reject );

            var callback = function( err, result ) {

                if( err ) {

                    var failError = new Error( 'expecting result' );
                    failError.cause = err;

                    return reject( failError );
                }

                return verifyResult( result, resultVerifier, resolve, reject );
            }

            try {

                self._handler( self._event, context, callback );
            }
            catch( err ) {

                reject( err );
            }
        });
    }
}

function create( handler ) {

    if( !handler ) {

        throw new Error( 'missing handler' );
    }

    return new LambdaTester( handler );
}

module.exports = create;
