# Getting Started

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
