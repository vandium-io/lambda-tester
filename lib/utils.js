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

function putValue( obj, nameOrPath, value ) {

    let pathParts = nameOrPath.split( '.' );

    while( pathParts.length > 1 ) {

        let name = pathParts.shift();

        if( obj[ name ] === undefined ) {

            let o = {};
            obj[ name ] = o;
            obj = o;
        }
        else {

            obj = obj[ name ];
        }
    }

    obj[ pathParts[0] ] = value;
}

module.exports = Object.assign( {}, vandiumUtils, {

        createLogStreamName,
        createFunctionArn,
        createId,
        putValue
    });
