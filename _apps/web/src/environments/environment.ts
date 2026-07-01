// Runtime web config. environment.local.ts (dev) / environment.deployment.ts (deploy) set window.env via an
// esbuild-bundled script loaded before the app, so the SPA talks to the API directly at api.url — no
// dev-server proxy, no rebuild to retarget an environment (deploy substitutes $API_URL at container start).
export type WebEnvironment = {
    production: boolean;
    api: { url: string };
};

declare global {
    interface Window {
        env: WebEnvironment;
    }
}

const readEnvironment = (): WebEnvironment => {
    if (!window.env) {
        throw new Error(`window.env is not initialized (assets/js/env.js failed to load)`);
    }
    return window.env;
};

export const environment = readEnvironment();
