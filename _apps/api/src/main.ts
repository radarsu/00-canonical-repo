import { existsSync, readFileSync } from "node:fs";
import { LEAF_CRT, LEAF_KEY } from "@app_/localhost-https/paths";
import { loadConfig } from "@puristic/env/index.js";
import { createApp } from "./app.js";
import definition, { CONFIG_SECRETS } from "./env.config.js";
import { mask } from "./log.js";
import { createLogger } from "./logger.js";
import { createPrisma } from "./prisma.js";

// Bun runs this TypeScript directly, in development and in the image alike; Bun.serve takes Hono's fetch handler as-is.
const config = loadConfig(definition);
const logger = createLogger(config);
logger.info({ config: mask(config, CONFIG_SECRETS) }, `config loaded`);

const prisma = createPrisma(config);
const app = createApp({ config, prisma, logger });

// Outside production, with no key and certificate configured, the API serves https with the pair `pnpm install` mints
// for this user (_tools/localhost-https), so the SPA's https origin can call it. Not behind a preview proxy, which sets
// PORT, terminates TLS itself and speaks plain http to this port.
const devPair = (): { key: Buffer; cert: Buffer } | undefined => {
    if (process.env[`NODE_ENV`] === `production` || process.env[`PORT`] !== undefined || !existsSync(LEAF_KEY) || !existsSync(LEAF_CRT)) {
        return undefined;
    }
    return { key: readFileSync(LEAF_KEY), cert: readFileSync(LEAF_CRT) };
};
const tls =
    config.api.httpsKey !== `` && config.api.httpsCert !== ``
        ? { key: readFileSync(config.api.httpsKey), cert: readFileSync(config.api.httpsCert) }
        : devPair();

const server = Bun.serve({
    port: config.api.port,
    hostname: config.api.host,
    fetch: app.fetch,
    ...(tls && { tls }),
});

// Bound to loopback in development but advertised as localhost: the name the dev certificate and CORS trust.
logger.info({ url: `${tls ? `https` : `http`}://localhost:${server.port}` }, `api started`);

const shutdown = async () => {
    logger.info(`shutting down`);
    await server.stop();
    await prisma.$disconnect();
    process.exit(0);
};

process.on(`SIGTERM`, () => void shutdown());
process.on(`SIGINT`, () => void shutdown());
