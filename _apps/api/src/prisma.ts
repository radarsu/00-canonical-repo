import { PrismaClient } from "@app_/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Config } from "./config.js";

// One PrismaClient per process, backed by the pg driver adapter. The connection string comes from
// validated config (never read from process.env directly — config is the single, typed entry point).
export const createPrisma = (config: Config): PrismaClient => {
    const adapter = new PrismaPg({ connectionString: config.database.url });
    return new PrismaClient({ adapter });
};
