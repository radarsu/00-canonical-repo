import { API_BASE_PATH, apiContract } from "@app_/api-contract";
import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { environment } from "../environments/environment";

// The app's one typed client, derived from the same contract the api implements, calling the api's origin directly.
export const api: ContractRouterClient<typeof apiContract> = createORPCClient(
    new OpenAPILink(apiContract, { url: `${environment.api.url}${API_BASE_PATH}` }),
);
