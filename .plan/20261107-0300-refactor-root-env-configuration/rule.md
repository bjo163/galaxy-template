# Rules

1. Keep secrets out of tracked examples and logs.
2. Preserve `pnpm dev` behavior and make the root `.env` available to each app process.
3. Do not remove unrelated variables or change database/auth behavior beyond consolidating environment configuration.
4. Arsy remains configured by the repository-root `.env` for dev, migrations, and start commands.
5. Use repo-relative paths in documentation.
