import type { WebEnvironment } from "./environment";

// The image: `build` bundles this into dist/assets/js/env.js with `$API_URL` left a literal placeholder, which the
// container's entrypoint substitutes (envsubst) at start. Every deploy-time value is a `$NAME` here and a name in
// entrypoint.sh's envsubst list.
window.env = {
    production: true,
    api: { url: `$API_URL` },
} satisfies WebEnvironment;
