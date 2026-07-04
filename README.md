# Canonical Repo

Full-stack starter template for internal apps. It encodes the default workspace shape, tooling, and runtime
conventions: a typed API, Vue web app, shared contract, Prisma-backed Postgres, shared UI primitives, typed
environment config, and one-command local development.

## Stack

- Runtime and orchestration: Bun for the API, pnpm workspaces, and Turbo.
- API: Hono, oRPC, Better Auth, Prisma 7, Postgres, Pino, and optional OpenTelemetry tracing.
- Web: Vue 3, Vite, Vue Router, PrimeVue, Tailwind 4, and runtime `window.env` config.
- Shared packages: source-first TypeScript packages under `_libs/`.
- Tooling: strict TypeScript, oxlint, Prettier, commitlint, and shared tsconfig presets.

## Layout

```text
_apps/
  api/       Bun + Hono + oRPC backend
  web/       Vue + Vite SPA
_libs/
  api-contract/  shared oRPC contract and Zod schemas
  prisma/        Prisma schema, migrations, and generated client entry
  ui/            Vue UI primitives, PrimeVue theme, and shared styles
_tools/
  localhost-https/  local development TLS material
  tsconfig/         shared TypeScript configs
```

Every package is named `@app_/<name>` and the workspace includes every package one level below a
`_`-prefixed group directory.

## Getting Started

```sh
pnpm install
pnpm dev
```

`pnpm dev` copies `.env.example` to `.env` when needed, starts Postgres, applies migrations, and runs the API
and web app through Turbo. Open:

- Web: `https://localhost:4701`
- API health: `https://localhost:6480/health`

Trust `_tools/localhost-https/localhost-com-ca.crt` once in your OS or browser keychain to remove the local
TLS warning. For a real local secret, replace `BETTER_AUTH_SECRET` in `.env` with:

```sh
openssl rand -base64 32
```

## Common Commands

- `pnpm dev` - start the local stack.
- `pnpm check` - typecheck, lint, and format check.
- `pnpm build` - run package builds through Turbo.
- `pnpm db:up` / `pnpm db:down` - start or stop local Postgres.
- `pnpm db:migrate:dev` - author and apply a development migration.
- `pnpm db:migrate:deploy` - apply committed migrations.
- `pnpm db:generate` - regenerate the Prisma client.
- `pnpm db:studio` - open Prisma Studio.
- `pnpm trace:up` / `pnpm trace:down` - start or stop the optional local tracing backend.

## Source-First Packages

The shared packages are consumed from source rather than from emitted `dist` output. The API imports
workspace TypeScript directly through Bun. The web app resolves shared source through matching TypeScript
paths and Vite aliases, so contract and UI edits are visible without a separate library rebuild.

The Prisma package is the exception in one specific way: it still exposes a source entry (`client.ts`), but
that entry re-exports generated Prisma client code from `generated/`. Turbo owns the ordering:

- `@app_/prisma:build` runs `prisma generate`.
- `build`, `typecheck`, and `dev` depend on upstream package builds through `^build`.
- Therefore API and web tasks see the generated Prisma client before they run.

The root `dev` script intentionally does not call `pnpm db:generate` directly; generation belongs to the
Turbo task graph.

## API And Web Flow

`_libs/api-contract` declares the oRPC routes and Zod schemas. The API implements that contract, and the web
client derives its typed client from the same contract object. Auth is handled by Better Auth under
`/api/auth/**`; typed app calls go through `/rpc`; `/health` checks database connectivity.

The example domain is a per-user notes resource. It is small on purpose: it demonstrates the full
contract-to-handler-to-client-to-UI path without becoming application logic the next project has to undo.
