import { z } from "zod";

// The oRPC OpenAPI handler is mounted under this prefix on the server; the client link points at the
// same base so request URLs line up.
export const API_BASE_PATH = "/rpc";

// ---- auth ----

export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    image: z.string().nullable(),
});
export type User = z.infer<typeof UserSchema>;

// ---- notes (example domain: a minimal per-user CRUD resource) ----

export const NoteSchema = z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    createdAt: z.string(),
});
export type Note = z.infer<typeof NoteSchema>;

export const NoteListSchema = z.array(NoteSchema);

export const CreateNoteInputSchema = z.object({
    title: z.string().min(1).max(200),
    body: z.string().max(10_000).default(``),
});
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;

export const NoteIdInputSchema = z.object({ id: z.string().min(1) });
