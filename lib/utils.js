'use strict';

const vandiumUtils = require( 'vandium-utils' );

const uuid = require( 'uuid' );

function createLogStreamName( functionVersion, date ) {

    if( !date ) {

        date = new Date();
    }

    let year = date.getFullYear();

    let month = date.getMonth() + 1;

    if( month < 10 ) {

        month = '0' + month;
    }

    let day = date.getDate();

    if( day < 10 ) {

        day = '0' + day;
    }

    let id = createId().replace( '-', '' ).replace( '-', '' ).replace( '-', '' ).replace( '-', '' );

    return `${year}/${month}/${day}/[${functionVersion}]${id}`;
}

function createFunctionArn( functionName ) {

    let region = process.env.AWS_REGION;

    if( !region ) {

        region = 'us-east-1';
    }

    return `arn:aws:lambda:${region}:999999999999:function:${functionName}`;
}

function createId() {

    return uuid.v4();
}

module.exports = Object.assign( {}, vandiumUtils, {

        createLogStreamName,
        createFunctionArn,
        createId
    });
