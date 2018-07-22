# Node.js Version Verification

The default behavior of `lambda-tester` is to verify the version of the Node.js environment to ensure compatibility with the AWS Lambda
runtime. Node.js versions of `8.x` are allowed.

## To disable version Verification

Version verification can be disabled several ways:

### Via environment variable

```
LAMBDA_TESTER_NODE_VERSION_CHECK=false
```

### Via code

```js
// disable version checking
const LambdaTester = require( 'lambda-tester' ).noVersionCheck();

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
