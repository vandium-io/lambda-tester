

const states = (() => {

    let s = {};

    [

        [ 'contextSucceed', true, 'context.succeed()' ],
        [ 'contextFail', false, 'context.fail()' ],
        [ 'callbackResult', true, 'callback(null,result)' ],
        [ 'callbackError', false, 'callback(error)' ],
        [ 'promiseResolve', true, 'Promise.resolve()' ],
        [ 'promiseReject', false, 'Promise.reject()' ],
        [ 'result', true, 'result' ],
        [ 'error', false, 'error' ],

    ].forEach( ([name,success,method]) => {

        s[ name ] = { name, success, method };
    });

    return s;
})();

module.exports = states;
