// The runtime web config. environment.local.ts (dev) or environment.deployment.ts (the image) sets window.env from a
// script index.html loads before the app, so one build artifact serves any environment.
export type WebEnvironment = {
    production: boolean;
    // The browser-facing origin of the api, which the SPA calls directly: cross-origin, CORS-allowed, no dev-server proxy.
    api: { url: string };
};

declare global {
    interface Window {
        env?: WebEnvironment;
    }
}

const { env } = window;
if (env === undefined) {
    throw new Error(`window.env is not initialized: /assets/js/env.js did not load before the app`);
}

export const environment: WebEnvironment = env;
