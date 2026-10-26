import { existsSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "@app_/constants/node";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads .env. In a checkout the CLI reads DATABASE_URL from the monorepo-root .env (variables
// already in the environment win); the api image carries no .env, so there it comes from the container's environment
// alone. `build` sets a placeholder: generating the client never connects.
const rootEnv = join(repoRoot(import.meta.url), `.env`);
if (existsSync(rootEnv)) {
    process.loadEnvFile(rootEnv);
}

export default defineConfig({
    schema: `./schema.prisma`,
    // Explicit so `prisma migrate deploy --config node_modules/@app_/prisma/prisma.config.ts` finds the migrations beside
    // this file whatever the working directory.
    migrations: {
        path: `./migrations`,
    },
    datasource: {
        url: env(`DATABASE_URL`),
    },
});
