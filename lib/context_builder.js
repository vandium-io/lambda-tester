'use strict';

const utils = require( './utils' );

function addValueIfNotSet( context, name, value ) {

    if( !context[ name ] ) {

        context[ name ] = value;
    }
}

function create( baseContext ) {

    let context = Object.assign( {}, baseContext );

    addValueIfNotSet( context, 'functionName', 'testLambda' );
    addValueIfNotSet( context, 'functionVersion', '$LATEST' );
    addValueIfNotSet( context, 'memoryLimitInMB', '128' );
    addValueIfNotSet( context, 'logGroupName', `/aws/lambda/${context.functionName}` );
    addValueIfNotSet( context, 'logStreamName', utils.createLogStreamName( context.functionVersion, new Date() ) );
    addValueIfNotSet( context, 'invokedFunctionArn', utils.createFunctionArn( context.functionName ) );
    addValueIfNotSet( context, 'invokeid', utils.createId() );
    addValueIfNotSet( context, 'awsRequestId', context.invokeid );

    return context;
}

module.exports = create;
