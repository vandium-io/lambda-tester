'use strict';

function getActiveHandles() {

    return process._getActiveHandles();
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

            if( !containsState( savedState, handle ) ) {

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
