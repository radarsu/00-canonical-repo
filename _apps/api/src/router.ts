import type { apiContract } from "@app_/api-contract";
import type { Router } from "@orpc/server";
import type { OrpcContext } from "./context.js";
import { notesRoutes } from "./notes/notes.routes.js";

// The per-domain handlers assembled into the contract's shape. Typed by the contract rather than inferred, so a procedure
// the contract declares and no domain serves fails the compile here instead of answering 404 at runtime.
export const router: Router<typeof apiContract, OrpcContext> = {
    notes: notesRoutes,
};
