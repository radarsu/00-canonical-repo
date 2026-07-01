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
- **Source-first libs.** Every lib has **no build step** — its `main`/`exports` point at source (`./src/index.ts`,
  or `./client.ts` for prisma). Bun runs the `.ts` directly; Angular resolves them via `tsconfig` `paths`.
  Editing a contract is reflected in both API and web instantly, no rebuild. Their `build`/`typecheck` is just
  `tsc --noEmit`. `prisma` is source-first too: `client.ts` re-exports its generated client and Bun runs it
  directly — `build` is only `prisma generate` (generated code is git-ignored). Nothing emits, so there's no
  composite `tsconfig.libs.json`; Turbo's `^build` ordering handles prisma's `generate` for consumers.
- **Typed env — @puristic/env.** One Zod schema in `_apps/api/src/config.ts` is the source of truth. Var
  names are derived by SCREAMING_SNAKE-casing the schema path (`api.port` → `API_PORT`). Sources merge
  `.env` < process env < CLI args. Secrets are tagged `.meta({ secret: true })` and masked in logs (`mask()`
  in `_apps/api/src/log.ts`). `.env.example` is committed; `.env` is git-ignored.
- **Logging — pino.** A root logger ([_apps/api/src/logger.ts](_apps/api/src/logger.ts)) fed by the typed
  config: `LOG_LEVEL` sets verbosity, `LOG_PRETTY` toggles colorized dev output (in-process pino-pretty stream,
  Bun-safe) vs. single-line JSON for prod. A Hono middleware binds a per-request child logger (correlated by
  `requestId`) that flows onto the oRPC context, so every handler logs with request scope (`context.logger`);
  completed requests log method/path/status/duration. `redact` scrubs secret-ish fields; config secrets are
  masked via `mask()`. Promote `logger.ts`/`tracing.ts` to a shared `_backend/api-shared` if a second backend
  app appears (the atlas pattern).
- **Tracing — OpenTelemetry.** Off by default (zero overhead). Enable by setting `OTEL_EXPORTER_OTLP_ENDPOINT`
  (+ optional `OTEL_SERVICE_NAME`) and running `pnpm trace:up` (bundled Jaeger, UI at http://localhost:16686).
  `@hono/otel` emits a per-request SERVER span with W3C trace-context propagation and semantic-convention
  `http.*` attributes ([_apps/api/src/tracing.ts](_apps/api/src/tracing.ts)); a manual `NodeTracerProvider` is
  used because Bun can't monkey-patch for auto-instrumentation. The pino `mixin` stamps `trace_id`/`span_id` on
  every request-scoped log, so logs and traces correlate. OTel keeps its **standard `OTEL_*` env contract**
  (read directly by the SDK, not the purenv schema). `pnpm trace:down` stops Jaeger.
- **Scripts naming.** Canonical verbs everywhere: `dev` (watch), `build` (artifact), `typecheck`, `lint`,
  `format`. Grouped infra is colon-namespaced: `db:up`/`db:down`, `db:migrate` (author a dev migration),
  `db:deploy` (apply committed migrations), `db:studio`, `deps:up`. Each layer's name matches its target —
  `db:migrate` → prisma `migrate` (`prisma migrate dev`), `db:deploy` → prisma `deploy` (`prisma migrate deploy`).
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
pnpm install   # resolves catalog + workspace deps
pnpm dev       # ONE command: ensures .env, starts Postgres, migrates, generates prisma,
               # then runs API (https://localhost:6480) + web (https://localhost:47145)
```

`pnpm dev` copies `.env.example → .env` on first run (a placeholder secret, fine for local dev). For a real
secret set `BETTER_AUTH_SECRET` with `openssl rand -base64 32`. Stop Postgres with `pnpm db:down`. Trust
`_tools/localhost-https/localhost-com-ca.crt` in your keychain once to drop the TLS warning.

Then open https://localhost:47145 → create an account (email+password) → add/delete notes. The whole
round-trip is typed from `_libs/api-contract`: change a route or schema there and both sides update with no
rebuild.

### Launching from an agent / LLM

`pnpm dev` is the single entry point — run it in the background, then health-gate on the API:

```bash
curl -k https://localhost:6480/health   # → {"status":"ok"} once up
# web: https://localhost:47145
```

It's idempotent (safe to re-run) and self-contained (docker + migrations + codegen + both servers).

## Verify

- `pnpm typecheck` — all packages type-check (Turbo builds prisma first).
- `pnpm lint` — Biome clean.
- `pnpm build` — web emits `dist/`, api type-checks, prisma generates.
- Edit a field in `_libs/api-contract/src/schemas.ts` → it surfaces immediately in `_apps/api` handlers and
  `_apps/web` calls (source-first, no rebuild).
