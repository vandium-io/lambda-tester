# Verifying Promises

On April 2, 2018 AWS Lambda introduced support for Node.js 8.10 and Lambda handlers that can return a promise directly -
eliminating the need to invoke the callback previously passed to the handler or the earlier `context.fail()`,
`context.succeed()` and `context.done()` methods.


## Verifying `Promise.resolve()`

When the Lambda handler returns a `Promise` that resolves, verification can be performed using `expectResolve()`. If the handler calls
anything other function or the `Promise` rejects, then the test will fail.

```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResolve();
	});
});
```

To verify the `result` value from `Promise.resolve`:

```js
const LambdaTester = require( 'lambda-tester' );

// Mocha using Chai
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Fred' } )
			.expectResolve( ( result, additional ) => {

                expect( result.userId ).to.exist;
                expect( result.user ).to.equal( 'fredsmith' );
            });
	});
});
```

The `additional` parameter contains information such as AWS x-ray data and execution information. The function passed to `expectResolve()` can return a `Promise` to perform asynchronous operation. Operations that require a callback for asynchronous operations can use the `done` parameter:

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
			.expectResolve( ( result, additional, done ) => {

                // this function will call done when complete
                asyncOperation( result, done );
            });
	});
});
```

## Verifying `Promise.reject()`

When the Lambda handler returns a `Promise` that rejects, verification can be performed using `expectReject()`. If the handler calls
anything other function or the `Promise` resolves, then the test will fail.


```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( err )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectReject();
	});
});
```

To verify the value of `err` from `Promise.reject()`, pass a validator to `expectReject()`:

```js
const LambdaTester = require( 'lambda-tester' );

// Mocha using Chai
const expect = require( 'chai' ).expect;

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( err )', function() {

		return LambdaTester( myHandler )
			.event( { name: 'Unknown' } )
			.expectReject( ( err, additional ) => {

				expect( err.message ).to.equal( 'User not found' );
			});
	});
});
```

The `additional` parameter contains information such as AWS x-ray data and execution information. The function passed to `expectReject()` can return a `Promise` to perform asynchronous operation. Operations that require a callback for asynchronous operations can use the `done` parameter:

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
			.expectReject( ( err, additional, done ) => {

                asyncOperation( err, done );
			});
	});
});
```

**Note:** Promise verification cannot be used to verify `callback()`, `context.succeed()`, `context.fail()` or `context.done()`.
