'use strict';

const AWS = require( 'aws-sdk' );

const TOPIC_ARN = 'YOUR_TOPIC_ARN_GOES_HERE';

/**
 * Gets a list of buckets
 */
exports.handler = function( event, context, callback ) {

    let sns = new AWS.SNS();

    var params = {

        TopicArn: TOPIC_ARN,
        Message: event.message || '',
        Subject: event.subject || 'unknown'
    };

    sns.publish( params, ( err, data ) => {

        if( err ) {

            return callback( err );
        }

        callback( null, {

            id: data.MessageId,
            result: 'message sent',
        });
    });
};
