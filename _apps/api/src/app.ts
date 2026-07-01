import { API_BASE_PATH } from "@app_/api-contract";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { ORPCError } from "@orpc/server";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { type Auth, createAuth } from "./auth.js";
import type { Config } from "./config.js";
import { buildOrpcContext } from "./context.js";
import { router } from "./router.js";
import type { Prisma } from "./types.js";

const logUnexpectedError = (error: unknown): void => {
    // oRPC "expected" errors (UNAUTHORIZED, NOT_FOUND, …) are control flow, not incidents — don't log them.
    if (error instanceof ORPCError && error.code !== `INTERNAL_SERVER_ERROR`) {
        return;
    }
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
};

// Hono owns HTTP; oRPC owns the typed RPC surface. The two meet at the `${API_BASE_PATH}/*` catch-all,
// where the OpenAPI handler dispatches to the contract router with a freshly built per-request context.
export const createApp = (config: Config, prisma: Prisma): { app: Hono; auth: Auth } => {
    const auth = createAuth(config, prisma);

    const orpcHandler = new OpenAPIHandler(router, {
        interceptors: [
            async (options) => {
                try {
                    return await options.next();
                } catch (error) {
                    logUnexpectedError(error);
                    throw error;
                }
            },
        ],
    });

    const app = new Hono();

    app.use(`*`, cors({ origin: config.webOrigin, credentials: true }));
    app.use(`*`, secureHeaders({ crossOriginEmbedderPolicy: false }));

    // Better Auth owns everything under /api/auth (sign-in, OAuth callback, session, sign-out).
    app.on([`POST`, `GET`], `/api/auth/**`, (c: Context) => auth.handler(c.req.raw));

    app.get(`/health`, async (c) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return c.json({ status: `ok` });
        } catch (error) {
            return c.json({ status: `error`, message: error instanceof Error ? error.message : `unknown` }, 503);
        }
    });

    // Everything under /rpc flows through the oRPC OpenAPI handler.
    app.all(`${API_BASE_PATH}/*`, async (c) => {
        const context = await buildOrpcContext({ auth, prisma, config }, c.req.raw.headers);
        const result = await orpcHandler.handle(c.req.raw, { context, prefix: API_BASE_PATH });
        if (result.matched) {
            return result.response;
        }
        return c.notFound();
    });

    return { app, auth };
};
