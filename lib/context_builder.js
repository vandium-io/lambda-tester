'use strict';

const { createId, createLogStreamName, createFunctionArn } = require( './utils' );

function create( { invokeid, functionName = 'testLambda', functionVersion = '$LATEST', ...baseContext } ) {

    if( !invokeid ) {

        invokeid = createId();
    }

    return {

        functionName,
        functionVersion,
        memoryLimitInMB: '128',
        logGroupName: `/aws/lambda/${functionName}`,
        logStreamName: createLogStreamName( functionVersion, new Date() ),
        invokedFunctionArn: createFunctionArn( functionName ),
        invokeid,
        awsRequestId: invokeid,

        ...baseContext
    };
}

module.exports = create;
