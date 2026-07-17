import { defaultEnv } from "./environment.default";

// Dev: the browser calls the API directly at its https origin (matching the https dev-server, so the session
// cookie rides and there's no mixed content). esbuild bundles this into public/assets/js/env.js for dev (Vite),
// filling __API_URL__ from $API_URL — daemon previews inject API_URL={previewUrl:api} (the sibling api preview,
// see templates.json); local dev falls back to https://localhost:6480 (see package.json).
declare const __API_URL__: string;

window.env = {
    ...defaultEnv,
    api: { url: __API_URL__ },
};
