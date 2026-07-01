import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { Config } from "./config.js";
import type { Prisma } from "./types.js";

export type Auth = ReturnType<typeof createAuth>;

// Better Auth instance. The handler is mounted at /api/auth/** in app.ts; the browser calls it directly at
// the API origin (api.url), so baseURL is the API origin and the SPA (webOrigin) is a trusted origin.
// Email+password is enabled for zero-config local dev; Google is added only when credentials are present.
export const createAuth = (config: Config, prisma: Prisma) =>
    betterAuth({
        secret: config.betterAuth.secret,
        baseURL: config.api.url,
        basePath: `/api/auth`,
        trustedOrigins: [config.webOrigin],
        database: prismaAdapter(prisma, { provider: `postgresql` }),
        emailAndPassword: { enabled: true },
        socialProviders: config.google.clientId ? { google: { clientId: config.google.clientId, clientSecret: config.google.clientSecret } } : {},
    });
