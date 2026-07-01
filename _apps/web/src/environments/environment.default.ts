// Base web environment. environment.local.ts (dev) / environment.deployment.ts (deploy) spread this and set
// api.url. esbuild bundles the right one into assets/js/env.js, loaded before the app so window.env exists
// at module-eval time (see environment.ts).
export const defaultEnv = {
    production: false,
    // Browser-facing origin of the API the SPA calls directly.
    api: { url: `` },
};
