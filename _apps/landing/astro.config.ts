import { defineConfig } from "astro/config";

// A standalone static landing page. Tailwind 4 is wired through PostCSS (postcss.config.mjs) rather than the Vite
// plugin, which is incompatible with the rolldown-based vite this monorepo pins. The dev server's port is injected
// by the sandbox's app process manager (see package.json `dev`), so multiple landing pages don't collide.
// Under the sandbox the preview proxy fronts us on the wildcard host <repo>.preview.<zone> and speaks http to
// 127.0.0.1:PORT — so bind all interfaces and accept any Host (harmless for standalone localhost dev too).
export default defineConfig({
    server: { host: true, allowedHosts: true },
});
