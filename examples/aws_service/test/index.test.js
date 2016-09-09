'use strict';

/* jshint expr: true */

const expect = require( 'chai' ).expect;

const LambdaTester = require( 'lambda-tester' );

const proxyquire = require( 'proxyquire' ).noCallThru();

const sinon = require( 'sinon' );

const TOPIC_ARN = 'YOUR_TOPIC_ARN_GOES_HERE';

describe( 'index', function() {

    let lambda;

    let AWSStub;

    let snsStub;

    beforeEach( function() {

        snsStub = {

            publish: sinon.stub()
        };

        AWSStub = {

            SNS: sinon.stub().returns( snsStub )
        };

        lambda = proxyquire( '../index', {

            'aws-sdk': AWSStub
        });
    });

    describe( '.handler', function() {

        it( 'send message', function() {

            snsStub.publish.yieldsAsync( null, {

                 MessageId: 'e6fe8c0b-55e7-5ddc-863b-dc46435b33ec'
             });

            return LambdaTester( lambda.handler )
                .event( {

                    subject: 'testing',
                    message: '1-2-3'
                })
                .expectResult( ( result ) => {

                    expect( result ).to.eql( {

                        id: 'e6fe8c0b-55e7-5ddc-863b-dc46435b33ec',
                        result: 'message sent'
                    });

                    expect( snsStub.publish.calledOnce ).to.be.true;
                    expect( snsStub.publish.firstCall.args[0] ).to.eql( {

                        TopicArn: TOPIC_ARN,
                        Message: '1-2-3',
                        Subject: 'testing'
                    });
                });
        });

        it( 'send message, with empty event', function() {

            snsStub.publish.yieldsAsync( null, {

                 MessageId: 'e6fe8c0b-55e7-5ddc-863b-dc46435b33ec'
             });

            return LambdaTester( lambda.handler )
                .expectResult( ( result ) => {

                    expect( result ).to.eql( {

                        id: 'e6fe8c0b-55e7-5ddc-863b-dc46435b33ec',
                        result: 'message sent'
                    });

                    expect( snsStub.publish.calledOnce ).to.be.true;
                    expect( snsStub.publish.firstCall.args[0] ).to.eql( {

                        TopicArn: TOPIC_ARN,
                        Message: '',
                        Subject: 'unknown'
                    });
                });
        });

        it( 'fail to send message', function() {

            snsStub.publish.yieldsAsync( new Error( 'something went wrong' ) );

            return LambdaTester( lambda.handler )
                .event( {

                    subject: 'testing',
                    message: '1-2-3'
                })
                .expectError( ( err ) => {

                    expect( err.message ).to.equal( 'something went wrong' );

                    expect( snsStub.publish.calledOnce ).to.be.true;
                    expect( snsStub.publish.firstCall.args[0] ).to.eql( {

                        TopicArn: TOPIC_ARN,
                        Message: '1-2-3',
                        Subject: 'testing'
                    });
                });
        });
    });
});
