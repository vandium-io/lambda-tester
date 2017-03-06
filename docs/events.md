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
