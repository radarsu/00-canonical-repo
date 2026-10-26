import { join } from "node:path";
import { repoRoot } from "@app_/constants/node";
import { type ConfigDefinition, cliArgs, env, envFile, inspectSchema } from "@puristic/env/index.js";
import { z } from "zod";

// The api's whole configuration, one Zod schema. @puristic/env maps each dotted path to SCREAMING_SNAKE for the
// environment and kebab-case for flags (database.url → DATABASE_URL / --database-url); `.meta({ secret: true })` marks a
// secret, masked in logs and encryptable in place with `purenv`. The default export is the definition `purenv` and the
// editor extension discover.
const configSchema = z.object({
    database: z.object({
        url: z.string().min(1).meta({ secret: true }),
        // Per-process pg pool cap: replicas × poolMax must stay under Postgres max_connections.
        poolMax: z.coerce.number().int().positive().default(10),
    }),
    // The browser origin the SPA is served from, the one origin CORS lets call this API.
    webOrigin: z.url(),
    api: z
        .object({
            port: z.coerce.number().int().positive().default(6580),
            // Loopback in development; the image binds every interface so a proxy in another container can reach it.
            host: z.string().default(`127.0.0.1`),
            // TLS key and certificate paths. Empty outside production falls back to the per-user development pair
            // (main.ts); in production TLS is terminated by the proxy in front.
            httpsKey: z.string().default(``),
            httpsCert: z.string().default(``),
        })
        .prefault({}),
    log: z
        .object({
            level: z.enum([`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`]).default(`info`),
            // z.stringbool parses true/false/1/0, where z.coerce.boolean would read the string "false" as true.
            pretty: z.stringbool().default(process.env[`NODE_ENV`] !== `production`),
        })
        .prefault({}),
});

export type Config = z.infer<typeof configSchema>;

// Merge order, later wins: the monorepo-root .env file (absent in the image, which is configured by its environment
// alone), then the process environment, then CLI flags.
const definition = {
    schema: configSchema,
    sources: [envFile(join(repoRoot(import.meta.url), `.env`)), env(), cliArgs()],
} satisfies ConfigDefinition<typeof configSchema>;

export default definition;

// Dotted paths of the secret leaves, for mask() before the config is logged. Derived from the schema, so marking a new
// leaf secret is the whole change.
export const CONFIG_SECRETS = inspectSchema(configSchema)
    .filter((leaf) => leaf.secret)
    .map((leaf) => leaf.path.join(`.`));
