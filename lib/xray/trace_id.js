'use strict';

const HEX = 16;

const MS_PER_SEC = 1000;

function generateRandomHex( length ) {

    let string = '';

    for( let i = 0; i < length; i++ ) {

        string += Math.floor( Math.random() * HEX ).toString( HEX );
    }

    return string;
}

function createTraceId() {

    let timestamp = Math.round( new Date().getTime() / MS_PER_SEC ).toString( HEX );

    let randomHex = generateRandomHex( 24 );

    let id = `1-${timestamp}-${randomHex}`;

    let parent = generateRandomHex( 16 );

    return `Root=${id};Parent=${parent};Sampled=1`;
}

module.exports = createTraceId;
