# Verifying `context.succeed()`, `context.fail` and `context.done()`


## Verifying `context.succeed()`

When the Lambda calls `context.succeed()`, verification can be performed using `expectSucceed()`. If the code calls anything else other than
`context.succeed()` or `context.done( null, result )`, then the test will fail.


```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../my-handler' ).handler;

describe( 'handler', function() {

	it( 'test success', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectSucceed();
	});
});
```

To verify the state of the result, the test can include a validator to inspect the result:

```js
const LambdaTester = require( 'lambda-tester' );

// Mocha using Chai
const expect = require( 'chai' ).expect;

const myHandler = require( '../my-handler' ).handler;

describe( 'handler', function() {

	it( 'test success', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectSucceed( ( result ) => {

				expect( result.userId ).to.exist;
				expect( result.user ).to.equal( 'fredsmith' );
			});
	});
});
```

**Note:** `context.succeed()` cannot be used to verify `callback( null, result )`.


## Verifying `context.fail()`

As with verifying success, when the Lambda calls `context.fail()`,  verification can be performed using `expectFail()`. If the code calls
anything else other than `context.fail()` or `context.done( err )`, then the test will fail.

```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test failure', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectFail();
	});
});
```

To verify the state of the error, the test can include a validator to inspect the error:

```js
const LambdaTester = require( 'lambda-tester' );

// Mocha using Chai
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test failure', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectFail( ( err ) => {

				expect( err.message ).to.equal( 'User not found' );
			});
	});
});
```

**Note:** `context.fail()` cannot be used to verify `callback( err )`.


## Verifying `context.done()`

Internally, AWS Lambda routes `context.done()` to `context.succed()` and `context.fail()` for results or errors respectively, thus you can
use the methods described above to verify those scenarios.
