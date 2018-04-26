'use strict';

const RecordTester = require( './record' );

class S3Tester extends RecordTester {

    constructor() {

        super( 's3' );
    }

    configurationId( id ) {

        return this.serviceValue( 'configurationId', id );
    }

    bucket( name, arn, ownerIdentity ) {

        this.serviceValue( 'bucket.name', name );

        if( arn ) {

            this.serviceValue( 'bucket.arn', arn );
        }

        if( ownerIdentity ) {

            this.serviceValue( 'bucket.ownerIdentity', ownerIdentity );
        }

        return this;
    }

    object( key, size, eTag, sequencer ) {

        this.serviceValue( 'object.key', key );

        if( size !== undefined ) {

            this.serviceValue( 'object.size', size );
        }

        if( eTag !== undefined ) {

            this.serviceValue( 'object.eTag', eTag );
        }

        if( sequencer !== undefined ) {

            this.serviceValue( 'object.sequencer', sequencer );
        }

        return this;
    }

    eventName( name ) {

        return this.recordValue( 'eventName', name );
    }

    region( awsRegion ) {

        return this.recordValue( 'awsRegion', awsRegion );
    }

    _createRecord() {

        let record = super._createRecord();

        record.eventVersion = '2.0';
        record.eventTime = new Date().toISOString();

        record.requestParameters = { sourceIPAddress: '127.0.0.1' };

        record.s3 = {

            configurationId: 'myConfigurationId',
            object: {

                key: 'unknown.txt',
                size: 1234,
                eTag: '0123456789abcdef0123456789abcdef',
                sequencer: '0A1B2C3D4E5F678901'
            },
            bucket: {

                arn: 'myArnHere',
                name: 'sample-bucket',
                ownerIdentity: {

                    principalId: 'USER'
                }
            },
            s3SchemaVersion: '1.0'
        };

        record.responseElements = {

            "x-amz-id-2": 'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH',
            "x-amz-request-id": 'EXAMPLE123456789'
        };

        record.awsRegion = 'us-east-1';
        record.eventName = 'ObjectCreated:Put';
        record.userIdentity = {

            principalId: 'USER'
        };

        record.eventSource = 'aws:s3';

        return record;
    }
}

module.exports = S3Tester;
