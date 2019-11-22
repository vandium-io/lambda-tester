# Resource Leak detection

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

				// leaks a resource


                callback( null, 'ok' );
            })
			.expectResult( function( result ) {

                // will never get here
            });
	});
});
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

				// leak here

                callback( null, 'ok' );
            })
			.expectResult( ( result ) => {

                throw new Error( 'should not produce a result' );
            })
            .catch( ( err ) => {

                expect( err.message ).to.contain( 'Potential handle leakage detected' );

                // TODO: add further validation here
            });
	});
});
```
