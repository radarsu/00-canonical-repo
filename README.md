# safe-parking — monorepo template (Hono + oRPC + Angular)

The **standard** for our repos: a small, buildable full-stack app that encodes the conventions every
project should share — workspace layout, versioning, env management, source-first libs, scripts naming, and
DX tooling. Copy it to start a new project, or align an existing repo to it.

Stack: **Bun** (API runtime) · **Hono + oRPC** (typed API) · **Better Auth** + **Prisma 7** (Postgres) ·
**Angular 21** (zoneless, standalone, signals) + **PrimeNG 21** + **Tailwind 4** · **@puristic/env** (typed
env) · **pnpm** (workspaces + catalog) · **Turbo** (orchestration) · **Biome** (lint + format).

## Layout

```
_apps/    runnable apps       — api (Bun/Hono/oRPC), web (Angular)
_libs/    shared packages     — api-contract (source-first), ui (source-first), prisma (build-to-dist)
_tools/   build/infra support — tsconfig (shared TS configs), localhost-https (dev TLS)
```

Every package is `@app_/<name>` and depends on siblings via `workspace:*`. The workspace glob is `_*/*`.

**Scaling up.** When `_libs/` outgrows "pure + contract" packages, split by concern exactly as the larger
repos do: `_backend/` (backend-only shared libs — loggers, service utils) and `_frontend/` (Angular feature
modules + UI). The lean 3-folder layout here is the starting point, not a ceiling.

## Conventions

- **Versioning — pnpm catalog.** Every dependency version lives once in `pnpm-workspace.yaml` under
  `catalog:`; packages reference `catalog:`. Upgrade in one place. `.npmrc` sets `save-prefix=` so nothing
  drifts off the catalog.
- **Source-first libs.** `api-contract` and `ui` have **no build step** — their `main`/`exports` point at
  `./src/index.ts`. Bun runs the `.ts` directly; Angular resolves them via `tsconfig` `paths`. Editing a
  contract is reflected in both API and web instantly, no rebuild. Their `build`/`typecheck` script is just
  `tsc --noEmit`. **`prisma` is the sole exception** (it re-exports generated code, so it builds to `dist`).
- **Typed env — @puristic/env.** One Zod schema in `_apps/api/src/config.ts` is the source of truth. Var
  names are derived by SCREAMING_SNAKE-casing the schema path (`api.port` → `API_PORT`). Sources merge
  `.env` < process env < CLI args. Secrets are tagged `.meta({ secret: true })` and masked in logs (`mask()`
  in `_apps/api/src/log.ts`). `.env.example` is committed; `.env` is git-ignored.
- **Scripts naming.** Canonical verbs everywhere: `dev` (watch), `build` (artifact), `typecheck`, `lint`,
  `format`. Grouped infra is colon-namespaced: `db:up`, `db:migrate`, `db:studio`, `deps:up`. Run everything
  from the root via Turbo (`pnpm dev`, `pnpm build`, `pnpm typecheck`).
- **Style — Biome only.** `biome.json`: 4-space, 150 width, LF, backtick strings, organize-imports on. No
  Prettier, no ESLint. Format: `pnpm format`; check: `pnpm lint`.
- **Angular — zoneless.** `provideZonelessChangeDetection()`, standalone components, `OnPush`, signals. No
  `zone.js`. UI is PrimeNG themed through `provideUi()` with a Tailwind-bridged palette (one set of
  `--color-*` vars drives both systems — see `_libs/ui/src/styles`).
- **Runtime web config.** `window.env` is bundled by esbuild from `environments/environment.{local,deployment}.ts`
  into `assets/js/env.js`, loaded before bootstrap — one build artifact retargets via `$API_URL` at deploy.
- **Commits.** Conventional Commits enforced by a native `.githooks/commit-msg` hook (commitlint), wired by
  the root `prepare` script (`core.hooksPath` — no husky/lefthook framework).
- **Editor.** `.vscode/` recommends Biome/Angular/Prisma/Tailwind/purenv extensions and sets Biome as
  formatter + organize-imports on save; `.editorconfig` mirrors the Biome rules.

## Getting started

```bash
pnpm install                       # resolves catalog + workspace deps
cp .env.example .env               # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm db:generate                   # generate the Prisma client
pnpm db:up                         # start Postgres (docker) + apply migrations
pnpm dev                           # API (bun, https://localhost:6480) + web (https://localhost:47145)
```

Trust `_tools/localhost-https/localhost-com-ca.crt` in your keychain once to drop the TLS warning.

Then open https://localhost:47145 → create an account (email+password) → add/delete notes. The whole
round-trip is typed from `_libs/api-contract`: change a route or schema there and both sides update with no
rebuild.

## Verify

- `pnpm typecheck` — all packages type-check (Turbo builds prisma first).
- `pnpm lint` — Biome clean.
- `pnpm build` — web emits `dist/`, api type-checks, prisma generates.
- Edit a field in `_libs/api-contract/src/schemas.ts` → it surfaces immediately in `_apps/api` handlers and
  `_apps/web` calls (source-first, no rebuild).
