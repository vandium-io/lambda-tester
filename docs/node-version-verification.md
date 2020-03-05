# Node.js Version Verification

Previous versions of `lambda-tester` verified the version of the node environment.
Starting with version 4.0, this functionality is disabled by default as the AWS support
for Node.js is a lot more varied than earlier implementations.

## To enable version Verification

Version verification can be enabled several ways:

### Via environment variable

```
LAMBDA_TESTER_NODE_VERSION_CHECK=true
```

### Via code

```js
// enable version checking
const LambdaTester = require( 'lambda-tester' ).enableVersionCheck();

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
