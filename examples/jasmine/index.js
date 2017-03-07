'use strict';

exports.handler = function( event, context, callback ) {

    callback( null, event.name );
}
