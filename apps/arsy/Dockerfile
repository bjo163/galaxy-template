# Build from the repository root:
# docker build -f apps/arsy/Dockerfile -t arsy:local .
FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter arsy build
RUN pnpm --filter arsy deploy --prod --legacy /out/arsy

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV ARSY_PORT=3001
WORKDIR /app

COPY --from=build --chown=10001:10001 /out/arsy ./

USER 10001:10001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
