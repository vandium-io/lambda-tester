# lambda-tester

Simplifies writing unit tests for [AWS Lambda](https://aws.amazon.com/lambda/details) functions using [Node.js](https://nodejs.org).

## Features
* Verifies correct handler behavior
* Works asynchronously
* AWS X-Ray support [experimental]
* Detects resource leaks [experimental]
* Verifies Node.js runtime version
* Supports Promises
* Easily integrates with test frameworks (Mocha and Jasmine)
* Handlers can be loaded and removed after execution
* Lightweight and won't impact performance
* Maps the environment variable `LAMBDA_TASK_ROOT` to the application's root
* Automatically loads .env files
* Works with Node 8.x

## Table of Contents

- [Installation](installation.md)
- [Getting Started](getting-started.md)
- [Verifying `context.succeed()`, `context.fail` and `context.done()`](context-succeed-fail-done.md)
- [Verifying `callback()`](callback.md)
- [Verifying `Promise.resolve()` and `Promise.reject()`](promise.md)
- [Custom Event Values](events.md)
- [Resource Leak Detection](leak-detection.md)
- [Detecting Handlers than Run for Too Long](long-running-handlers.md)
- [Using `lambda-tester` with Mocha and Jasmine](test-frameworks.md)
- [Loading handlers manually](loading.md)
- [Using environment variables](env.md)
- [Configuration settings](configuration.md)
- [Node.js Version Verification](node-version-verification.md)


## Feedback

We'd love to get feedback on how you're using lambda-tester and things we could add to make this tool better. Feel free to contact us at `feedback@vandium.io`

## Compatibility

Starting with version 3.5.0, lambda-tester supports node versions 8.11 and higher. If you require support for older versions of node, then use a previous version of lambda-tester.

## License

[BSD-3-Clause](https://en.wikipedia.org/wiki/BSD_licenses)
