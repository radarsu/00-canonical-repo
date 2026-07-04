# @app_/prisma

Owns the database schema, generated Prisma client, and migrations. **Source-first** like the rest of
`_libs/` — `client.ts` re-exports `./generated`, and Bun runs it directly, so there's no dist build; only
`prisma generate` produces code (git-ignored).

- `pnpm db:generate` — regenerate the client (`./generated`) after editing `schema.prisma`.
- `pnpm db:migrate:dev` — author + apply a dev migration (`prisma migrate dev`).
- `pnpm db:migrate:deploy` — apply committed migrations (`prisma migrate deploy`, CI / prod / local startup).
- `pnpm db:studio` — open Prisma Studio.

Consumed as `import { PrismaClient } from "@app_/prisma"`; the API constructs it with the pg driver adapter
in `_apps/api/src/prisma.ts`.
