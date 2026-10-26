# check=skip=JSONArgsRecommended
# The api image: Bun runs the TypeScript source directly, so the api is never compiled.
#
# The build context is the pruned tree `pnpm deploy --prod` writes outside the repository (docker-release.sh --prune):
# the api, its production dependencies and its workspace packages at their built dist. That tree IS the context, so
# nothing else of the repository can leak in and no .dockerignore exists to drift.
#
# Configuration is injected by the deployment, never baked: DATABASE_URL, WEB_ORIGIN, LOG_LEVEL… (src/env.config.ts).
FROM oven/bun:1.4.4-slim@sha256:1846adf22496bd711036aae8be147e57bdebbaea2e5264e3e0b5af1db187d9a4
WORKDIR /app
COPY . /app
# Development binds loopback; a container binds every interface so a proxy in a sibling container reaches it. TLS is
# terminated by that proxy.
ENV NODE_ENV=production API_HOST=0.0.0.0 API_PORT=6580
EXPOSE 6580
# Before serving: apply the pending migrations, then refuse to boot while the live schema differs from this build's (an
# edited applied migration, or drift made by hand), which migration bookkeeping alone does not notice. Shell form for the
# `&&` chain (hence the JSONArgsRecommended skip on line 1); `exec` makes bun PID 1, so the deployment's SIGTERM reaches
# the shutdown handler.
CMD bun node_modules/prisma/build/index.js migrate deploy --config node_modules/@app_/prisma/prisma.config.ts \
    && bun node_modules/prisma/build/index.js migrate diff --from-config-datasource \
        --to-schema node_modules/@app_/prisma/schema.prisma --exit-code \
        --config node_modules/@app_/prisma/prisma.config.ts \
    && exec bun src/main.ts
