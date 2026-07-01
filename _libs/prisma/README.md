# @app_/prisma

Owns the database schema, generated Prisma client, and migrations. The one **build-to-dist** lib
(`build` = `prisma generate` + `tsc`) — everything else in `_libs/` is source-first.

- `pnpm db:generate` — regenerate the client (`./generated`) after editing `schema.prisma`.
- `pnpm db:migrate` — create + apply a dev migration (`prisma migrate dev`).
- `pnpm db:deploy` — apply committed migrations (CI / prod).
- `pnpm db:studio` — open Prisma Studio.

Consumed as `import { PrismaClient } from "@app_/prisma"`; the API builds it with the pg driver adapter
in `_apps/api/src/prisma.ts`.
