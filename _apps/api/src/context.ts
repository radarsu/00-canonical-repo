import type { User } from "@app_/api-contract";
import type { Auth } from "./auth.js";
import type { Config } from "./config.js";
import type { Logger } from "./logger.js";
import type { Prisma } from "./types.js";

// Per-request context handed to every oRPC handler: the shared Prisma client, the loaded config, the resolved
// session user (null when unauthenticated), and the per-request logger (a child bound to this request's id).
export interface OrpcContext {
    prisma: Prisma;
    config: Config;
    user: User | null;
    logger: Logger;
}

export const buildOrpcContext = async (
    deps: { auth: Auth; prisma: Prisma; config: Config; logger: Logger },
    headers: Headers,
): Promise<OrpcContext> => {
    const session = await deps.auth.api.getSession({ headers });
    const user: User | null = session
        ? { id: session.user.id, email: session.user.email, name: session.user.name, image: session.user.image ?? null }
        : null;
    return { prisma: deps.prisma, config: deps.config, user, logger: deps.logger };
};
