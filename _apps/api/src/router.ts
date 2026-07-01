import { apiContract } from "@app_/api-contract";
import { implement, ORPCError } from "@orpc/server";
import type { OrpcContext } from "./context.js";

// implement(contract) yields a type-safe route factory bound to our per-request context. Each handler's
// input/output is checked against the contract — drift between contract and implementation is a compile error.
const os = implement(apiContract).$context<OrpcContext>();

const requireUser = (context: OrpcContext) => {
    if (!context.user) {
        throw new ORPCError(`UNAUTHORIZED`);
    }
    return context.user;
};

export const router = {
    me: {
        get: os.me.get.handler(({ context }) => context.user),
    },
    notes: {
        list: os.notes.list.handler(async ({ context }) => {
            const user = requireUser(context);
            const notes = await context.prisma.note.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: `desc` },
            });
            return notes.map((note) => ({
                id: note.id,
                title: note.title,
                body: note.body,
                createdAt: note.createdAt.toISOString(),
            }));
        }),
        create: os.notes.create.handler(async ({ context, input }) => {
            const user = requireUser(context);
            const note = await context.prisma.note.create({
                data: { userId: user.id, title: input.title, body: input.body },
            });
            return { id: note.id, title: note.title, body: note.body, createdAt: note.createdAt.toISOString() };
        }),
        remove: os.notes.remove.handler(async ({ context, input }) => {
            const user = requireUser(context);
            const result = await context.prisma.note.deleteMany({ where: { id: input.id, userId: user.id } });
            if (result.count === 0) {
                throw new ORPCError(`NOT_FOUND`);
            }
            return { id: input.id };
        }),
    },
};
