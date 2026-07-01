import { resolve } from "node:path";
import { type ConfigDefinition, cliArgs, env, envFile, loadConfig as loadPuristicConfig } from "@puristic/env/index.js";
import { z } from "zod";

// Root .env, resolved relative to this file so loading is cwd-independent (dev runs from _apps/api).
const rootEnv = resolve(import.meta.dirname, "../../../.env");

// Nested schema — @puristic/env derives env var names by SCREAMING_SNAKE-casing each path segment and
// joining with "_": database.url → DATABASE_URL, betterAuth.secret → BETTER_AUTH_SECRET, api.port →
// API_PORT. Secrets are tagged with .meta({ secret: true }) so they're masked in logs (and encryptable
// later via `purenv encrypt`).
const configSchema = z.object({
    database: z.object({
        url: z.string().min(1).meta({ secret: true }),
    }),
    betterAuth: z.object({
        secret: z.string().min(1).meta({ secret: true }),
    }),
    // Origin the browser is served from — CORS allow-origin + Better Auth trusted origin.
    webOrigin: z.string().url(),
    // Optional Google OAuth. Empty by default; email+password sign-in works without it for local dev.
    google: z
        .object({
            clientId: z.string().default(``),
            clientSecret: z.string().default(``).meta({ secret: true }),
        })
        .prefault({}),
    api: z
        .object({
            url: z.string().url().default(`https://localhost:6480`),
            port: z.coerce.number().int().positive().default(6480),
            // Dev TLS cert/key paths (the @app_/localhost-https package). Empty in prod (proxy terminates TLS).
            httpsKey: z.string().default(``),
            httpsCert: z.string().default(``),
        })
        .prefault({}),
});

// Merge order (later wins): .env file < process env < CLI args. So `bun start --api.port=7000` overrides.
const definition = {
    schema: configSchema,
    sources: [envFile(rootEnv), env(), cliArgs()],
} satisfies ConfigDefinition<typeof configSchema>;

export type Config = z.infer<typeof configSchema>;

// Dotted paths of secret fields — pass to mask() before logging the config.
export const CONFIG_SECRETS = [`database.url`, `betterAuth.secret`, `google.clientSecret`];

export const loadConfig = (): Config => {
    const config = loadPuristicConfig(definition);
    if (!config.google.clientId || !config.google.clientSecret) {
        console.log(`Note: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET unset — using email+password sign-in only.`);
    }
    return config;
};
