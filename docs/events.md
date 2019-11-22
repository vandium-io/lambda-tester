# Custom Event Values

Custom events can be provided to `lambda-tester` using `event()`, which accepts an object, array or value.

The following example provides an object to supply a `name` property:

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

Some AWS Lambda services use `Array` instances to pass multiple `event` values. To do this with `lambda-tester`, just supply an array of
events:

```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'test callback( null, result )', function() {

		return LambdaTester( myHandler )
			.event( [
				{
					// user 1
					name: 'Fred'
				},
				{
					// user 2
					name: 'Joe'
				}
			])
			.expectResult();
	});
});
```

Events can also be created using the `lambda-event-mock` library. This is achieved
by supplying a function to `event()`:

```js
const LambdaTester = require( 'lambda-tester' );

const myHandler = require( '../index' ).handler;

describe( 'handler', function() {

	it( 'normal operation', async function() {

		await LambdaTester( myHandler )
			.event( (eventMocks) => eventMocks.s3()
						.bucket( 'my-bucket' )
						.object( 'my-key', { size: 456} )
						.configurationId( '1234' )
						.build()
				  )
			.expectResult();
	});
});
```
