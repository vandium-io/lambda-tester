# Verifying Callbacks

The initial implementation of AWS Lambda used `context.succeed()`, `context.fail()` and `context.done()` to control termination of the
function. On April 8, 2016 AWS Lambda introduced support for Lambda callbacks that replace the need to call `context.fail()`,
`context.succeed()` and `context.done()`.


## Verifying `callback( null, result )`

When the Lambda handler calls `callback( null, result )`, verification can be performed using `expectResult()`. If the handler calls
anything other than `callback( null, result )`, then the test will fail.

```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult();
	});
});
```

To verify the `result` value from `callback()`:

```js
const LambdaTester = require( 'lambda-tester' );

// Mocha using Chai
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult( ( result, additional ) => {

                expect( result.userId ).to.exist;
                expect( result.user ).to.equal( 'fredsmith' );
            });
	});
});
```

The `additional` parameter contains information such as AWS x-ray data and execution information. The function passed to `expectResult()` can return a `Promise` to perform asynchronous operation. Operation that require a callback for asynchronous operations can use the `done` parameter:

```js
const LambdaTester = require( 'lambda-tester' );

// Mocha using Chai
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

const asyncOperation = require( '../my-async-op' );

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResult( ( result, additional, done ) => {

                // this function will call done when complete
                asyncOperation( result, done );
            });
	});
});
```

## Verifying `callback( err )`

When the Lambda handler calls `callback( err )`, verification can be performed using `expectError()`. If the handler calls
anything other than `callback( err )`, then the test will fail.


```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( err )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectError();
	});
});
```

To verify the value of `err` from `callback()`, pass a validator to `expectError()`:

```js
const LambdaTester = require( 'lambda-tester' );

// Mocha using Chai
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( err )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectError( ( err, additional ) => {

				expect( err.message ).to.equal( 'User not found' );
			});
	});
});
```

The `additional` parameter contains information such as AWS x-ray data and execution information. The function passed to `expectError()` can return a `Promise` to perform asynchronous operation. Operation that require a callback for asynchronous operations can use the `done` parameter:

```js
const LambdaTester = require( 'lambda-tester' );

// Mocha using Chai
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

const asyncOperation = require( '../my-async-op' );

describe( 'handler', function() {

	it( 'test callback( err )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectError( ( err, additional, done ) => {

                asyncOperation( err, done );
			});
	});
});
```

**Note:** Callback verification cannot be used to verify `context.succeed()`, `context.fail()` or `context.done()`.
