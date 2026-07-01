import { oc } from "@orpc/contract";
import { CreateNoteInputSchema, NoteIdInputSchema, NoteListSchema, NoteSchema, UserSchema } from "./schemas.js";

export * from "./schemas.js";

// Contract-first: routes are declared here as method + path + input/output Zod schemas, with NO
// implementation. The API implements them (implement(apiContract) in _apps/api) and the web app derives
// a fully-typed client from the same object (ContractRouterClient<typeof apiContract>) — one source of
// truth for the wire shape, edited once, reflected instantly on both sides (source-first, no rebuild).

// Current authenticated user, or null when there is no session.
export const meContract = {
    get: oc.route({ method: `GET`, path: `/me` }).output(UserSchema.nullable()),
};

// Per-user notes — a small CRUD resource demonstrating the full contract → handler → client → UI flow.
export const notesContract = {
    list: oc.route({ method: `GET`, path: `/notes` }).output(NoteListSchema),
    create: oc.route({ method: `POST`, path: `/notes` }).input(CreateNoteInputSchema).output(NoteSchema),
    remove: oc.route({ method: `DELETE`, path: `/notes/{id}` }).input(NoteIdInputSchema).output(NoteIdInputSchema),
};

// Aggregated contract router — the object both sides import.
export const apiContract = {
    me: meContract,
    notes: notesContract,
};
