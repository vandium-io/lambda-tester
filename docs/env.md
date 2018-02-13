# Using Environment Variables

Environment variables can be set and read automatically by placing an `.env` file in the base path of your Lambda handler project, or by using lambda-tester's [configurations settings](configuration.md) to specify a file.

To use a JSON format, put a `.json` extension at the end of your file name. Remember to add this to your `.gitignore` file (or similar) so that you don't accidentally commit it to a repository.

For more information about configuring an `.env` file, see the author's
[documentation](https://github.com/motdotla/dotenv).

For more information about configuring an `.env.json` file, see the author's
[documentation](https://github.com/maxbeatty/dotenv-json)
