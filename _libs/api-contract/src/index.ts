import { oc } from "@orpc/contract";
import { z } from "zod";

// Where the api mounts the oRPC handler and the web client points its link: one constant for both ends.
export const API_BASE_PATH = `/rpc`;

// Dates cross the wire as ISO strings: the OpenAPI protocol carries JSON, so a `Date` would arrive as a string anyway.
export const NoteSchema = z.object({
    id: z.uuid(),
    text: z.string(),
    createdAt: z.iso.datetime(),
});
export type Note = z.infer<typeof NoteSchema>;

export const NewNoteSchema = z.object({
    text: z.string().trim().min(1).max(500),
});

// The example domain: small on purpose, it shows the contract → handler → client → UI path and nothing a project has to
// undo. Each procedure is a plain HTTP route under API_BASE_PATH (OpenAPI protocol), so it is callable without oRPC too.
export const notesContract = {
    list: oc.route({ method: `GET`, path: `/notes` }).output(z.array(NoteSchema)),
    create: oc.route({ method: `POST`, path: `/notes` }).input(NewNoteSchema).output(NoteSchema),
    remove: oc
        .route({ method: `DELETE`, path: `/notes/{id}` })
        .input(z.object({ id: z.uuid() }))
        .output(z.object({ ok: z.literal(true) })),
};

// Both ends are typed from this one object: the api implements it (`implement(apiContract)`), the web derives its client
// from it (`ContractRouterClient<typeof apiContract>`).
export const apiContract = {
    notes: notesContract,
};
