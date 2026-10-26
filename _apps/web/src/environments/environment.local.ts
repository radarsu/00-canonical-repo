import type { WebEnvironment } from "./environment";

// Development only: the `dev` script bundles this into public/assets/js/env.js before vite starts, filling __API_URL__
// from $API_URL (https://localhost:6580 by default; a preview proxy sets its sibling api's address).
declare const __API_URL__: string;

window.env = {
    production: false,
    api: { url: __API_URL__ },
} satisfies WebEnvironment;
