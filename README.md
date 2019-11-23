[![Build Status](https://travis-ci.org/vandium-io/lambda-tester.svg?branch=master)](https://travis-ci.org/vandium-io/lambda-tester)
[![npm version](https://badge.fury.io/js/lambda-tester.svg)](https://badge.fury.io/js/lambda-tester)

# lambda-tester

Simplifies writing unit tests for [AWS Lambda](https://aws.amazon.com/lambda/details) functions using [Node.js](https://nodejs.org).

## Features
* Verifies correct handler behavior
* Mocks event types with code
* Works asynchronously
* Supports Promises
* Verifies Node.js runtime version
* AWS X-Ray support [experimental]
* Detects resource leaks [experimental]
* Easily integrates with test frameworks (Mocha and Jasmine)
* Handlers can be loaded and removed after execution
* Lightweight and won't impact performance
* Maps the environment variable `LAMBDA_TASK_ROOT` to the application's root
* Automatically loads .env files
* Works with Node 10.x, and 12.x

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

	it( 'test success', async function() {

		await LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult();
	});
});
```

If the handler calls `callback( err )`, then the test will fail.

Additionally, if one wanted to test for failure, then the following code would be used:

```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test failure', async function() {

		await LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectError();
	});
});
```

**Note:** you must either return the `LambdaTester` instance back to the testing
framework or use the `await`/`async` keywords.

## Documentation

Complete documentation can be found in our [documentation](docs) page.

## Projects Using `lambda-tester`

* [vandium](https://github.com/vandium-io/vandium-node) - Secures and simplifies AWS Lambda handlers

## Feedback

We'd love to get feedback on how you're using lambda-tester and things we could add to make this tool better. Feel free to contact us at `feedback@vandium.io`

## Compatibility

Starting with version 4.0, lambda-tester supports node versions 10 and higher. If you require support for older versions of node, then use a previous version of lambda-tester.


## License

[BSD-3-Clause](https://en.wikipedia.org/wiki/BSD_licenses)
