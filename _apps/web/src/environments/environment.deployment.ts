import { defaultEnv } from "./environment.default";

// Deploy: $API_URL is substituted (envsubst) when the container starts, so one build artifact serves any
// environment. esbuild bundles this into assets/js/env.js during the web build (see package.json).
window.env = {
    ...defaultEnv,
    production: true,
    api: { url: `$API_URL` },
};
