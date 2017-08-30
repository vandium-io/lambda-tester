# Detecting Handlers than Run for Too Long

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
			.expectResult( ( result ) => {

                expect( result.userId ).to.exist;
                expect( result.user ).to.equal( 'fredsmith' );
            });
	});
});
```
