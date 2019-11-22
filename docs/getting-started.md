# Getting Started

Lambda handlers with support for callbacks use the typical Node.js asynchronous signature:

```js
// handler.js

exports.handler = function( event, context, callback ) {

    // your logic here

    callback( null, 'success!' );
}
```

The following example shows a simple case for validating that the Lambda handler using Mocha:

```js
const LambdaTester = require( 'lambda-tester' );

// Lambda handler
const myHandler = require( '../handler' ).handler;

describe( 'handler', function() {

	it( 'test success', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult();
	});
});
```

Performing the same test using the Jasmine framework would be as follows:

```js
const LambdaTester = require( 'lambda-tester' );

// Lambda handler
const myHandler = require( '../handler' ).handler;

describe( 'handler', function() {

	it( 'test success', function( done ) {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult()
            .verify( done );
	});
});
```

**Note:** that when testing using Jasmine, make sure you call `verify()`.

Please note that you must return the `LambdaTester` back to the framework since `lambda-tester` is asynchronous and uses Promises. Additionally you can run the test by declaring the test as `async`:

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
