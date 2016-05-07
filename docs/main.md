[![Build Status](https://travis-ci.org/vandium-io/lambda-tester.svg?branch=master)](https://travis-ci.org/vandium-io/lambda-tester)

# lambda-tester

Simplifies writing unit tests for [AWS Lambda](https://aws.amazon.com/lambda/details) functions using [Node.js](https://nodejs.org).

## Features
* Verifies correct handler behavior
* Works asynchronously like Lambda does
* Detects resource leaks [experimental]
* Supports Promises
* Easily integrates with test frameworks
* Lightweight and won't impact performance
* Maps the environment variable `LAMBDA_TASK_ROOT` to the application's root
* Automatically loads .env files
* Works with Node 4.3.2+

## Installation
Install via npm.

	npm install lambda-tester --save-dev


## Getting Started

Lambda handlers with support for callbacks use the typical Node.js asynchronous signature:

```js
exports.handler = function( event, context, callback ) {

    callback( null, 'success!' );
}
```


The following example shows a simple case for validating that the Lambda (handler) was called successfully (i.e. `callback( null, result )`:

```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test success', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult();
	});
});
```

If the handler decides to call `callback( err )` then the verification will fail and the test will fail.

Additionally, if one wanted to test for failure, then the following code would be used:

```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test failure', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectError();
	});
});
```

Please note that you must return the `LambdaTester` back to the framework since `lambda-tester` is asynchronous and uses Promises.


## Verifying Callbacks


To verify that `callback( null, result )` was called:

```js
const LambdaTester = require( 'lambda-tester' );

// your favorite validation tool here
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult( function( result ) {

                expect( result.userId ).to.exist;
                expect( result.user ).to.equal( 'fredsmith' );
            });
	});
});
```

To verify that `callback( err )` was called:

```js
const LambdaTester = require( 'lambda-tester' );

// your favorite validation tool here
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( err )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectError( function( err ) {

				expect( err.message ).to.equal( 'User not found' );
			});
	});
});
```

## Detecting Handlers than Run for Too Long

For Lambda handlers that must run within a specific time period, you can specify a timeout value. This value will not stop execution of your code, but will detect an error condition.

To use the timeout feature, specify a timeout value in seconds using `timeout()` as in the example below:

```js
const LambdaTester = require( 'lambda-tester' );

// your favorite validation tool here
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.timeout( 1 /* fail if longer than 1 second */ )
			.expectResult( function( result ) {

                expect( result.userId ).to.exist;
                expect( result.user ).to.equal( 'fredsmith' );
            });
	});
});
```

## Verifying `context.succeed()`, `context.fail` and `context.done()`

On April 8, 2016 AWS Lambda introduced support for Lambda callbacks that replace the need to call `context.fail()` or `context.succeed()`.

### Verifying `context.succeed()`

When `expectSucceed()` is called, one can pass a function to perform additional validation. For example:


```js
const LambdaTester = require( 'lambda-tester' );

// your favorite validation tool here
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test success', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectSucceed( function( result ) {

				expect( result.userId ).to.exist;
				expect( result.user ).to.equal( 'fredsmith' );
			});
	});
});
```

### Verifying `context.fail()`

As with verifying success, `expectFail` has an optional parameter that can specify a function that will verify the error condition. For example:

```js
const LambdaTester = require( 'lambda-tester' );

// your favorite validation tool here
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test failure', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectFail( function( err ) {

				expect( err.message ).to.equal( 'User not found' );
			});
	});
});
```

### Verifying `context.done()`

AWS Lambda routes `context.done()` to `context.succed()` and `context.fail()` for results or errors respectively, thus you can use the methods described above to verify those scenarios.

## Resource Leak detection

**Note**: This feature is experimental and disabled by default.

Resource leaks (i.e. streams and other callback events like timers) can be detected and reported. Timers or streams than continue to be active post `callback()` will cause the Lambda handler to execute in the AWS environment until a timeout condition is reached.

To enable leak detection:

```js
const LambdaTester = require( 'lambda-tester' );

LambdaTester.checkForResourceLeak( true );
```

When a leak is caught, it will cause an exception to be thrown on. For example, the following code will cause a timer to live past the callback:

```js
const LambdaTester = require( 'lambda-tester' );

const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

LambdaTester.checkForResourceLeak( true );

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( function( event, context, callback ) {

                setTimeout( function() {}, 100 );

                callback( null, 'ok' );
            })
			.expectResult( function( result ) {

                // will never get here
            });
	});
});
```

Examining the exception thrown will indicate a leak was detected and the handles for the resources that are still open:

```js
{ [Error: Potential handle leakage detected]
  handles:
   [ Timer {
       '0': [Function: listOnTimeout],
       _idleNext: [Object],
       _idlePrev: [Object],
       msecs: 100 } ] }
```

If you are adding leak detection as one of your unit tests, then the previous code should be changed to:

```js
const LambdaTester = require( 'lambda-tester' );

const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

LambdaTester.checkForResourceLeak( true );

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( function( event, context, callback ) {

                setTimeout( function() {}, 100 );

                callback( null, 'ok' );
            })
			.expectResult( function( result ) {

                throw new Error( 'should not produce a result' );
            })
            .catch( function( err ) {

                /* err will be:

                { [Error: Potential handle leakage detected]
                  handles:
                   [ Timer {
                       '0': [Function: listOnTimeout],
                       _idleNext: [Object],
                       _idlePrev: [Object],
                       msecs: 100 } ] }
                */

                expect( err.message ).to.contain( 'Potential handle leakage detected' );

                // TODO: add further validation here
            });
	});
});
```


## Feedback

We'd love to get feedback on how you're using lambda-tester and things we could add to make this tool better. Feel free to contact us at `feedback@vandium.io`


## Compatibility

Version 2.x targets Lambda handlers using Node 4.3.2. If you require support for Node 0.10.36 then use version 1.0.x.


## License

[BSD-3-Clause](https://en.wikipedia.org/wiki/BSD_licenses)

Copyright (c) 2016, Vandium Software Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Vandium Software Inc. nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
