import { randomUUID } from "node:crypto";
import { API_BASE_PATH } from "@app_/api-contract";
import type { PrismaClient } from "@app_/prisma";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError, ORPCError } from "@orpc/server";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { Logger } from "pino";
import type { OrpcContext } from "./context.js";
import type { Config } from "./env.config.js";
import { probeRoutes } from "./probe.routes.js";
import { router } from "./router.js";

type AppEnv = { Variables: { logger: Logger } };

// The request-body ceiling, decided before any route reads a body.
const BODY_LIMIT_BYTES = 1024 * 1024;

export const createApp = ({ config, prisma, logger }: { config: Config; prisma: PrismaClient; logger: Logger }): Hono<AppEnv> => {
    const app = new Hono<AppEnv>();

    // A child logger per request (by requestId), which logs the completed request; /health is skipped as probe noise.
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

    // Required, not a safety net: the SPA calls this API cross-origin, with no dev-server proxy in between.
    app.use(
        `*`,
        cors({
            origin: (origin, c) => {
                if (origin === config.webOrigin) {
                    return origin;
                }
                // Same-origin and server-to-server calls send no Origin; only a real mismatch is worth a warning.
                if (origin !== ``) {
                    c.get(`logger`).warn({ origin, expected: config.webOrigin }, `cors origin rejected`);
                }
                return null;
            },
        }),
    );
    app.use(`*`, secureHeaders());
    app.use(`*`, bodyLimit({ maxSize: BODY_LIMIT_BYTES, onError: (c) => c.text(`request body too large`, 413) }));

    app.route(
        `/`,
        probeRoutes({
            ping: async () => {
                await prisma.$queryRaw`SELECT 1`;
            },
        }),
    );

    const orpcHandler = new OpenAPIHandler(router, {
        interceptors: [
            onError((error, { context }) => {
                // oRPC's own errors (NOT_FOUND, BAD_REQUEST, ...) are answers, not incidents.
                if (error instanceof ORPCError && error.code !== `INTERNAL_SERVER_ERROR`) {
                    return;
                }
                context.logger.error({ err: error }, `unexpected error`);
            }),
        ],
    });

    app.all(`${API_BASE_PATH}/*`, async (c) => {
        const context: OrpcContext = { prisma, config, logger: c.get(`logger`) };
        const { matched, response } = await orpcHandler.handle(c.req.raw, { prefix: API_BASE_PATH, context });
        return matched ? response : c.notFound();
    });

    return app;
};
