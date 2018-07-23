# Change Log

## 3.5.0 (2018-07-23)

New:

* Support for async handlers that return promises.
  Thanks @jkehres @jamesdixon @dtothefp @HajoAhoMantila

Updated:

* Version checking is a little less strict and supports node versions in the 8.x range.
  Thanks @ArgamTorozyan

Internal:

  * Updated dependencies


## 3.4.1 (2018-05-03)

Fixed:

* `package.json` engines statement. Thanks @kaxelson


## 3.4.0 (2018-04-20)

Updated:

* Improved version checking using `semver`. Thanks @AlexHankins @wheresrhys

Fixed:

* `package.json` engines to include node 8.x. Thanks @zanzamar

## 3.3.0 (2018-04-03)

Updated:

* Version checking now includes `8.10.0`. Thanks @Limess

## 3.2.0 (2018-02-14)

New:

* JSON formatted env files. Thanks @debugwand

Internal:

* Updated dependencies

## 3.1.1 (2018-01-08)

Fixed:

* Error being generated when x-ray server mock gets closed. Thanks @anyong

Internal:

* Migrated from istanbul to nyc for test/coverage

## 3.1.0 (2017-09-11)

New:

* `LAMBDA_TESTER_NODE_VERSION_CHECK` environment variable support to prevent node version checking from running.
* Verification for AWS X-Ray (Experimental)

Updated:

* Updated verifiers to support async callback

Internal:

* Updated test dependencies


## 3.0.2 (2017-05-01)

Updated:

* Throw original error if thrown during callback( null, result ) case to preserve original stack trace to address how console.log() formats errors


## 3.0.1 (2017-04-27)

Fixed:

* Timeout enforced for default case. Thanks @AntonBazhal

Updated:

* Dependencies

## 3.0.0 (2017-04-26)

New:

* Configuration settings file (`.lambda-tester.json`)

Updated:

* Better support for Node 6.10.x

Internal:

* Refactored to improve testability
* Reworked Promise implementation

## 2.8.1 (2017-03-08)

Updated:

* Improved check for node version to allow versions below 7. Thanks @Kiniamaro

## 2.8.0 (2017-03-07)

New

* Added check for node version. Thanks @toaster

Updated:

* Automatically detects `done.fail()` to support Jasmine users. Thanks @toaster
* Updated documentation

Internal:

* Code clean-up and refactor

## 2.7.0 (2017-01-31)

Updated:

* `event` can an array (#9)


## 2.6.1 (2016-11-28)

Internal:

* Switched `node-uuid` version `1.4.7` to `uuid` version `3.0.0`.

## 2.6.0 (2016-06-27)

Updated:

* `context.fail()` and `callback()` now support strings, which will get converted into `Error` instances. This behavior matches
that of Lambda.

## 2.5.1 (2016-05-29)

Updated:

* `event()` changed to make a copy of the object that was passed

## 2.5.0 (2016-05-14)

New:

* Added auto generated context values to better simulate Lambda environment

## 2.4.0 (2016-05-11)

New:

* Added support for custom `context` values to support cognito identities and mobile apps. Thanks @xsurfing

## 2.3.0 (2016-05-10)

New:

* Automatically loads `.env` files when `lambda-tester` is loaded during `require()`.
* Handlers can be loaded and cleaned up after execution

Improved:

* Added cause to error messages

Updated:

* Leak detector moved to `lambda-leak` and included as a dependency. Still experimental status

## 2.2.1 (2016-04-17)

Fixed:

 * npm publish issue

## 2.2.0 (2016-04-17)

Experimental:

* Detects resources that might still be open and cause the Lambda handler to run longer than anticipated

## 2.1.0 (2016-04-10)

New:

* Support for using `GetRemainingTimeInMillis()` from the context object
* Timeout can be set for the tester so that it detects when the Lambda handler has run for too long
* Environment variable `LAMBDA_TASK_ROOT` is now set to the application root folder

Fixed:

* Updated documentation


## 2.0.0 (2016-04-09)

New:

* Can now use Promises within verifiers
* Supports Lambda Callbacks

Improved:

* No longer requires the 'done' callback from mocha. Expect handlers now return promises that can be resolved/rejected by mocha.

Compatibility:

* Node.js 4.3.2 or higher

## 1.0.1 (2016-04-03)

Fixed:

* Documentation examples contained some errors
* NPM package now smaller

## 1.0.0 (2016-03-22)

Initial Release
