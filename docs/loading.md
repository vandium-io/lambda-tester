# Loading Handlers Manually

For certain cases, it might be desirable to perform some additional configuration before loading the handler.
`lambda-tester` provides a `loadHandler()` function to allow the user to configure and return the handler.

The following example demonstrates the late loading of the handler:

```js
const LambdaTester = require( 'lambda-tester' );

describe( 'handler', function() {

	it( 'test success', function() {

		return LambdaTester()
			.event( { name: 'Fred' } )
            .loadHandler( () => {

                // do something extra - unload previous instance

                return require( '../handler' ).handler;
            })
			.expectResult();
	});
});
```

The result from `loadHandler()` can also be a Promise which will allow asynchronous operations to be performed as in the following example:

```js
const LambdaTester = require( 'lambda-tester' );

describe( 'handler', function() {

	it( 'test success', function() {

		return LambdaTester()
			.event( { name: 'Fred' } )
            .loadHandler( () => {

                // do something extra - unload previous instance

                let handlerModule = require( '../handler' );

                return handlerModule.myResourceLoaded()
                    .then( () => {

                        // s3 resource loaded!

                        return handlerModule.handler;
                    })
            })
			.expectResult();
	});
});
```
