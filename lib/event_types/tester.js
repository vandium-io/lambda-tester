'use strict';

const BaseTester = require( './base' );

const utils = require( '../utils' );

class Tester extends BaseTester {

    constructor( eventBase = {} ) {

        super( eventBase );
    }

    eventValue( nameOrPath, value ) {

        utils.putValue( this._event, nameOrPath, value );

        return this;
    }
}

module.exports = Tester;
