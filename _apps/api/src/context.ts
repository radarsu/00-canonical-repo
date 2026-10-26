import type { PrismaClient } from "@app_/prisma";
import type { Logger } from "pino";
import type { Config } from "./env.config.js";

// What every oRPC handler is handed: the process's PrismaClient, the loaded config, and the request-scoped logger.
export interface OrpcContext {
    prisma: PrismaClient;
    config: Config;
    logger: Logger;
}
