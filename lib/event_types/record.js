'use strict';

const BaseTester = require( './base' );

const utils = require( '../utils' );

class RecordBasedTester extends BaseTester {

    constructor( serviceName ) {

        super( {

            Records: []
        });

        this._serviceName = serviceName;
        this._currentRecord = null;
    }

    getOrCreateRecord() {

        let record = this._currentRecord;

        if( !record ) {

            record = this._createRecord();

            this._currentRecord = record;

            this._event.Records.push( record );
        }

        return record;
    }

    nextRecord() {

        this._currentRecord = null;

        return this;
    }

    recordValue( nameOrPath, value ) {

        utils.putValue( this.getOrCreateRecord(), nameOrPath, value );

        return this;
    }

    serviceValue( nameOrPath, value ) {

        let record = this.getOrCreateRecord();

        utils.putValue( record[ this._serviceName ], nameOrPath, value );

        return this;
    }

    _createRecord() {

        return {};
    }
}

module.exports = RecordBasedTester;
