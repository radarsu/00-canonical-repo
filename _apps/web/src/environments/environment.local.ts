import { defaultEnv } from "./environment.default";

// Dev: the browser calls the API directly at its https origin (matching the https dev-server, so the session
// cookie rides and there's no mixed content). esbuild bundles this into assets/js/env.js for `ng serve`.
window.env = {
    ...defaultEnv,
    api: { url: `https://localhost:6480` },
};
