# Build from the repository root:
# docker build -f apps/arsy/Dockerfile -t arsy:local .
FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter arsy build

FROM node:22-alpine AS runtime

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=build /workspace/apps ./apps
COPY --from=build /workspace/packages ./packages
RUN pnpm install --prod --filter arsy... --frozen-lockfile

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV ARSY_PORT=3001

USER 10001:10001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/arsy/dist/server.js"]
