const expect = require( 'chai' ).expect;

const States = require(  '../states' );

describe( 'lib/states', function() {

    describe( '.states', function() {

        it( 'expected states', function() {

            expect( States.callbackError ).to.exist;
            expect( States.callbackError.success ).to.be.false;

            expect( States.callbackResult ).to.exist;
            expect( States.callbackResult.success ).to.be.true;

            expect( States.contextFail ).to.exist;
            expect( States.contextFail.success ).to.be.false;

            expect( States.contextSucceed ).to.exist;
            expect( States.contextSucceed.success ).to.be.true;

            expect( States.promiseResolve ).to.exist;
            expect( States.promiseResolve.success ).to.be.true;

            expect( States.promiseReject ).to.exist;
            expect( States.promiseReject.success ).to.be.false;
        });
    });
});
