# Using `lambda-tester` with Mocha and Jasmine

## Mocha

Since `lambda-tester` uses Promises, it is important to return them to the test framework so that the test can be evaluated properly. Failing
to do this will result in broken/false tests.

```js
const LambdaTester = require( 'lambda-tester' );

// Lambda handler
const myHandler = require( '../handler' ).handler;

describe( 'handler', function() {

	it( 'test success', function() {

		//////////////////////////////////////
        // Make sure you return the tester!
        // |
        // V
		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult();
	});
});
```

## Jasmine

Jasmine does not support Promises as return types, and thus requires an additional step when verifying Lambda handlers. Tests should be set
to use asynchronous operation using the `done` callback and also requires `verify()` to be used with tests.

```js
const LambdaTester = require( 'lambda-tester' );

// Lambda handler
const myHandler = require( '../handler' ).handler;

describe( 'handler', function() {

	it( 'test success', function( done ) {

		//////////////////////////////////////
        // Make sure you return the tester!
        // |
        // V
		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult()
			.verify( done );	// <-- Must have verify at the end of
								//     the test with "done" being passed to control flow
	});
});
```
