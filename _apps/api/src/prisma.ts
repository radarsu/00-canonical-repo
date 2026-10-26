import { PrismaClient } from "@app_/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Config } from "./env.config.js";

// One PrismaClient per process, on the pg driver adapter; the connection string and pool cap come from the config.
export const createPrisma = (config: Config): PrismaClient =>
    new PrismaClient({ adapter: new PrismaPg({ connectionString: config.database.url, max: config.database.poolMax }) });
