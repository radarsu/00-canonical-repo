import { randomUUID } from "node:crypto";
import { API_BASE_PATH } from "@app_/api-contract";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { ORPCError } from "@orpc/server";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { type Auth, createAuth } from "./auth.js";
import type { Config } from "./config.js";
import { buildOrpcContext, type OrpcContext } from "./context.js";
import type { Logger } from "./logger.js";
import { router } from "./router.js";
import { createTracingHttpMiddleware } from "./tracing.js";
import type { Prisma } from "./types.js";

// Hono owns HTTP; oRPC owns the typed RPC surface. The two meet at the `${API_BASE_PATH}/*` catch-all, where
// the OpenAPI handler dispatches to the contract router with a freshly built per-request context.
type AppEnv = { Variables: { logger: Logger } };

const logUnexpectedError = (log: Logger, error: unknown): void => {
    // oRPC "expected" errors (UNAUTHORIZED, NOT_FOUND, …) are control flow, not incidents — don't log them.
    if (error instanceof ORPCError && error.code !== `INTERNAL_SERVER_ERROR`) {
        return;
    }
    log.error({ err: error }, `unexpected error`);
};

export const createApp = (config: Config, prisma: Prisma, logger: Logger): { app: Hono<AppEnv>; auth: Auth } => {
    const auth = createAuth(config, prisma);

    const app = new Hono<AppEnv>();

    // Outermost: the OTel server span (@hono/otel). Registered first so the request logger and oRPC handlers
    // run inside the active span — their pino mixin then stamps logs with the span's trace_id/span_id.
    app.use(`*`, createTracingHttpMiddleware());

    // Then bind a per-request child logger (correlated by requestId) and log the completed
    // request with method/path/status/duration. Skips /health to avoid liveness-probe noise.
    app.use(`*`, async (c, next) => {
        const requestLogger = logger.child({ requestId: randomUUID() });
        c.set(`logger`, requestLogger);
        const start = performance.now();
        await next();
        if (c.req.path !== `/health`) {
            requestLogger.info(
                { method: c.req.method, path: c.req.path, status: c.res.status, ms: Math.round(performance.now() - start) },
                `request completed`,
            );
        }
    });

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

    const orpcHandler = new OpenAPIHandler(router, {
        interceptors: [
            async (options) => {
                try {
                    return await options.next();
                } catch (error) {
                    // The per-request logger rides on the oRPC context (buildOrpcContext); fall back to root.
                    const log = (options.context as Partial<OrpcContext> | undefined)?.logger ?? logger;
                    logUnexpectedError(log, error);
                    throw error;
                }
            },
        ],
    });

    // Everything under /rpc flows through the oRPC OpenAPI handler, with the request logger on the context.
    app.all(`${API_BASE_PATH}/*`, async (c) => {
        const context = await buildOrpcContext({ auth, prisma, config, logger: c.get(`logger`) }, c.req.raw.headers);
        const result = await orpcHandler.handle(c.req.raw, { context, prefix: API_BASE_PATH });
        if (result.matched) {
            return result.response;
        }
        return c.notFound();
    });

    return { app, auth };
};
