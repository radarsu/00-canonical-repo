import { defineConfig } from "astro/config";

// A standalone static landing page. Tailwind 4 is wired through PostCSS (postcss.config.mjs) rather than the Vite
// plugin, which is incompatible with the rolldown-based vite this monorepo pins. The dev server's port is injected
// by the sandbox's app process manager (see package.json `dev`), so multiple landing pages don't collide.
export default defineConfig({});
