import { apiContract, type Note } from "@app_/api-contract";
import { implement, ORPCError } from "@orpc/server";
import type { OrpcContext } from "../context.js";

const os = implement(apiContract).$context<OrpcContext>();

const toNote = (row: { id: string; text: string; createdAt: Date }): Note => ({ id: row.id, text: row.text, createdAt: row.createdAt.toISOString() });

export const notesRoutes = {
    list: os.notes.list.handler(async ({ context }) => {
        const rows = await context.prisma.note.findMany({ orderBy: { createdAt: `desc` } });
        return rows.map(toNote);
    }),
    create: os.notes.create.handler(async ({ context, input }) => toNote(await context.prisma.note.create({ data: { text: input.text } }))),
    remove: os.notes.remove.handler(async ({ context, input }) => {
        const { count } = await context.prisma.note.deleteMany({ where: { id: input.id } });
        if (count === 0) {
            throw new ORPCError(`NOT_FOUND`, { message: `note not found` });
        }
        return { ok: true as const };
    }),
};
