'use strict';

function getActiveHandles() {

    return process._getActiveHandles();
}

function isHandleValid( handle ) {

    let valid = true;

    // special cases for Timers that might be finished but in the handler list
    if( handle.constructor && (handle.constructor.name === 'Timer') ) {

        if( (handle._idleNext === handle) && (handle._idlePrev === handle) ) {

            // handler has fired and just remains in queue
            valid = false;
        }
    }

    return valid;
}

function containsState( savedState, handle ) {

    for( let i = 0; i < savedState.length; i++ ) {

        if( handle === savedState[i] ) {

            return true;
        }
    }

    return false;
}

class ActiveHandleState {

    constructor() {

        // save a copy of the current handles
        this.savedState = getActiveHandles().slice( 0 );
    }

    getDifferenceInHandles() {

        let difference = [];

        let savedState = this.savedState;

        getActiveHandles().forEach( function( handle ) {

            if( !containsState( savedState, handle ) && isHandleValid( handle ) ) {

                difference.push( handle );
            }
        });

        return difference;
    }
}

function capture() {

    return new ActiveHandleState();
}

module.exports = {

    capture
};
