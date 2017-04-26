# Configuration settings

To provide configuration settings to `lambda-tester`, create a `.lambda-tester.json` file in the root path of your project.

## Syntax

```json
{
    "envFile": "<relative or absolute path>"
}
```

## `envFile`
Use this setting to specify the location (or name) of the `.env` file. If not specified, the value will default to `.env`. The following example will instruct `lambda-tester` to use the file `.env-deploy` in the project's root path when loading environment variables.

```json
{
    "envFile": ".env-deploy"
}
```
