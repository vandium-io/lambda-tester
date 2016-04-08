[![Build Status](https://travis-ci.org/vandium-io/lambda-tester.svg?branch=master)](https://travis-ci.org/vandium-io/lambda-tester)

# lambda-tester

Simplifies writing unit tests for [AWS Lambda](https://aws.amazon.com/lambda/details) functions using [Node.js](https://nodejs.org).

## Features
* Verifies correct handler behavior
* Works asynchronously like Lambda does
* Supports Promises
* Easily integrates with test frameworks
* No external dependencies
* Lightweight and won't impact performance
* Works with Node 4.3.2+

## Installation
Install via npm.

	npm install lambda-tester --save-dev

## Getting Started

The following example shows a simple case for validating that the Lambda (handler) was called successfully:

```js
var LambdaTester = require( 'lambda-tester' );

var myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test success', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectSucceed();
	});
});
```

If the handler decides to call `context.fail()` or `context.done( err )` then the verification will fail and the test will fail.

Additionally, if one wanted to test for failure, then the following code would be used:

```js
var LambdaTester = require( 'lambda-tester' );

var myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test failure', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectFail();
	});
});
```

As with the "succeed" example, if the handler calls `context.succeed()` or `context.done( null, result )` then the test will fail.

Please note that you must return the `LambdaTester` back to the framework since `lambda-tester` is asynchronous and uses Promises.

## Verifying Success

When `expectSucceed()` is called, one can pass a function to perform additional validation. For example:


```js
var LambdaTester = require( 'lambda-tester' );

// your favorite validation tool here
var expect = require( 'chai' ).expect;

var myHandler = require( '../index' ).handler;

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

## Verifying Failure

As with verifying success, `expectFail` has an optional parameter that can specify a function that will verify the error condition. For example:

```js
var LambdaTester = require( 'lambda-tester' );

// your favorite validation tool here
var expect = require( 'chai' ).expect;

var myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test success', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectFail( function( err ) {

				expect( err.message ).to.equal( 'User not found' );
			});
	});
});
```

## Verifying Lambda Callbacks

On April 8, 2016 AWS Lambda introduced support for Lambda callbacks that replace the need to call `context.fail()` or `context.succeed()`.

Lambda handlers with support for callbacks use the typical Node.js asynchronous signature:

```js
exports.handler = function( event, context, callback ) {

    callback( null, 'success!' );
}
```


To verify that the callback was called with the error parameter:

```js
var LambdaTester = require( 'lambda-tester' );

// your favorite validation tool here
var expect = require( 'chai' ).expect;

var myHandler = require( '../index' ).handler;

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

## Feedback

We'd love to get feedback on how to make this tool better. Feel free to contact us at `feedback@vandium.io`

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
