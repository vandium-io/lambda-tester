# lambda-tester

Simplifies writing unit tests for [AWS Lambda](https://aws.amazon.com/lambda/details) functions using [Node.js](https://nodejs.org).

## Features
* Verifies correct handler behavior
* Works asynchronously like Lambda does
* Detects resource leaks [experimental]
* Supports Promises
* Easily integrates with test frameworks (Mocha and Jasmine)
* Handlers can be loaded and removed after execution
* Lightweight and won't impact performance
* Maps the environment variable `LAMBDA_TASK_ROOT` to the application's root
* Automatically loads .env files
* Works with Node 6.10.x

## Table of Contents

- [Installation](installation.md)
- [Getting Started](getting-started.md)
- [Verifying `context.succeed()`, `context.fail` and `context.done()`](context-succeed-fail-done.md)
- [Verifying `callback()`](callback.md)
- [Custom Event Values](events.md)
- [Resource Leak Detection](leak-detection.md)
- [Detecting Handlers than Run for Too Long](long-running-handlers.md)
- [Using `lambda-tester` with Mocha and Jasmine](test-frameworks.md)
- [Loading handlers manually](loading.md)
- [Using environment variables](env.md)
- [Configuration settings](configuration.md)


## Feedback

We'd love to get feedback on how you're using lambda-tester and things we could add to make this tool better. Feel free to contact us at `feedback@vandium.io`


## Compatibility

Version 3.x targets Lambda handlers using Node 6.10.x. If you require support for Node 4.x, please use version 2.x


## License

[BSD-3-Clause](https://en.wikipedia.org/wiki/BSD_licenses)
