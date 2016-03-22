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

function createSucceedContext( tester, done ) {

    var context = createContext( tester );

    context.succeed = function( result ) {

        if( tester.resultVerifier ) {

            try {

                tester.resultVerifier( result );
            }
            catch( err ) {

                return done( err );
            }
        }

        done();
    };

    context.fail = function( err ) {

        var failError = new Error( 'encountered error but expected the handler to succeed' );
        failError.cause = err;

        done( failError );
    };

    return context;
}

function createFailContext( tester, done ) {

    var context = createContext( tester );

    context.succeed = function( result ) {

        var failError = new Error( 'encountered successful operation but expected failure' );
        failError.result = result;

        done( failError );
    };

    context.fail = function( err ) {

        if( tester.resultVerifier ) {

            try {

                tester.resultVerifier( err );
            }
            catch( verifyErr ) {

                return done( verifyErr );
            }
        }

        done();        
    }

    return context;
}

function LambdaTester( handler ) {

    if( !handler ) {

        throw new Error( 'missing handler' );
    }

    if( this === undefined ) {

        return new LambdaTester( handler );
    }

    this._handler = handler;

    this._event = {};

}

LambdaTester.prototype.event = function( event ) {

    if( !event ) {

        throw new Error( 'missing event' );
    }

    this._event = event;

    return this;
}


LambdaTester.prototype.expectSucceed = function( resultVerifier ) {

    this.resultVerifier = resultVerifier;

    this.verifyOperation = "succeed";

    return this;
}

LambdaTester.prototype.expectFail = function( resultVerifier ) {

    this.resultVerifier = resultVerifier;

    this.verifyOperation = "fail";

    return this;
}

LambdaTester.prototype.verify = function( done ) {

    if( !done ) {

        throw new Error( 'missing callback' );
    }

    if( !this.verifyOperation ) {

        throw new Error( 'call expectSucceed() or expectFailure() before calling verify' );
    }

    var context;

    switch( this.verifyOperation ) {

        case 'succeed':
            context = createSucceedContext( this, done );
            break;

        case 'fail':
            context = createFailContext( this, done );
            break;

        default:
            throw new Error( 'unknown operation: ' + this.verifyOperation );
    }

    return this._handler( this._event, context );
}


module.exports = LambdaTester;

