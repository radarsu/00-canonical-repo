import { readFileSync } from "node:fs";
import { createApp } from "./app.js";
import { CONFIG_SECRETS, loadConfig } from "./config.js";
import { mask } from "./log.js";
import { createLogger } from "./logger.js";
import { createPrisma } from "./prisma.js";

// Bun is the API runtime: it executes this TypeScript (and the source-first workspace libs) directly — no
// build step in dev. `bun --watch` restarts on change. Bun.serve is the native server; it takes Hono's
// fetch handler as-is and terminates TLS itself in dev (prod runs plain http behind a TLS proxy).
const config = loadConfig();
const logger = createLogger(config);
logger.info({ config: mask(config, CONFIG_SECRETS) }, `config loaded`);
if (!config.google.clientId || !config.google.clientSecret) {
    logger.warn(`GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET unset — using email+password sign-in only`);
}

const prisma = createPrisma(config);
const { app } = createApp(config, prisma, logger);

const tls =
    config.api.httpsKey && config.api.httpsCert ? { key: readFileSync(config.api.httpsKey), cert: readFileSync(config.api.httpsCert) } : undefined;

const server = Bun.serve({
    port: config.api.port,
    hostname: `127.0.0.1`,
    fetch: app.fetch,
    ...(tls && { tls }),
});

logger.info({ url: `${tls ? `https` : `http`}://127.0.0.1:${server.port}` }, `api started (auth at /api/auth, oRPC at /rpc)`);

const shutdown = async () => {
    logger.info(`shutting down`);
    await prisma.$disconnect();
    await server.stop();
    process.exit(0);
};

process.on(`SIGTERM`, () => void shutdown());
process.on(`SIGINT`, () => void shutdown());
