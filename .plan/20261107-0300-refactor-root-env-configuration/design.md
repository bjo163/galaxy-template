# Design

Root orchestration will load `.env` with Node's `--env-file-if-exists=.env` before invoking Turbo. The variables then flow to Turbo child tasks, including Next.js, while Arsy already loads the root file relative to its package directory. Root env template becomes canonical. Web Prisma CLI is given the root env path explicitly. Both current and legacy credential endpoints will route to Arsy using `ARSY_API_URL`.

The existing ignored root `.env` remains local and is not overwritten. Local secrets are not copied into tracked templates.
