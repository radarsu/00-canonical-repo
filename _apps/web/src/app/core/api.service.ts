import { Injectable } from "@angular/core";
import { apiContract } from "@app_/api-contract";
import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { environment } from "../../environments/environment";

// One typed client for the whole app, derived from the SAME apiContract the server implements. Every call
// (this.client.notes.list(), .notes.create({...})) is fully typed end to end — no codegen, no drift.
@Injectable({ providedIn: `root` })
export class ApiService {
    readonly client: ContractRouterClient<typeof apiContract> = createORPCClient(
        new OpenAPILink(apiContract, {
            url: `${environment.api.url}/rpc`,
            // credentials: include so the Better Auth session cookie rides along (cross-origin, CORS-allowed).
            fetch: (request) => globalThis.fetch(request, { credentials: `include` }),
        }),
    );
}
