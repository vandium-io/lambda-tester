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

        var context = createContext( this );

        var self = this;

        let succeedPromise = new Promise( function( resolve, reject ) {

            context.succeed = function( result ) {

                if( !resultVerifier ) {

                    resolve();
                }

                try {

                    resolve( resultVerifier( result ) );
                }
                catch( err ) {

                    reject( err );
                }
            };

            context.fail = function( err ) {

                var failError = new Error( 'encountered error but expected the handler to succeed' );
                failError.cause = err;

                reject( failError );
            }

            self._handler( self._event, context );
        });

        succeedPromise.verify = function( done ) {

            return this.then(
                function() {

                    done();
                },
                function( err ) {

                    done( err );
                }
            );
        }

        return succeedPromise;
    }

    expectFail( resultVerifier ) {

        var context = createContext( this );

        var self = this;

        let failPromise = new Promise( function( resolve, reject ) {

            context.fail = function( errResult ) {

                if( !resultVerifier ) {

                    resolve();
                }

                try {

                    resolve( resultVerifier( errResult ) );
                }
                catch( err ) {

                    reject( err );
                }
            };

            context.succeed = function( result ) {

                var failError = new Error( 'encountered successful operation but expected failure' );
                failError.result = result;

                reject( failError );
            }

            self._handler( self._event, context );
        });

        failPromise.verify = function( done ) {

            return this.then(
                function() {

                    done();
                },
                function( err ) {

                    done( err );
                }
            );
        }

        return failPromise;
    }
}

function create( handler ) {

    if( !handler ) {

        throw new Error( 'missing handler' );
    }

    return new LambdaTester( handler );
}

module.exports = create;
