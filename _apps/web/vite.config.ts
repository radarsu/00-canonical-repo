import { readFileSync } from "node:fs";
import { LEAF_CRT, LEAF_KEY } from "@app_/localhost-https/paths";
import vue from "@vitejs/plugin-vue";
import { defaultClientConditions, defineConfig, type ServerOptions } from "vite";

// A preview proxy (templates.json `previews`) injects PORT, fronts this server with its own TLS and reaches it under a
// host name of its own: behind it, bind every interface, accept any Host and serve plain http. Standalone, serve
// https://localhost:4801 (the origin the API's WEB_ORIGIN trusts) with the per-user dev certificate `pnpm install`
// mints, so the page can call the https API without mixed content.
const port = process.env[`PORT`];

// Read only while serving: `vite build` loads this config too, on machines (CI, an image build) that never mint a leaf.
const serverOptions = (command: `build` | `serve`): ServerOptions => {
    if (port !== undefined) {
        return { host: `0.0.0.0`, port: Number(port), strictPort: true, allowedHosts: true };
    }
    return {
        host: `localhost`,
        port: 4801,
        strictPort: true,
        ...(command === `serve` && { https: { cert: readFileSync(LEAF_CRT), key: readFileSync(LEAF_KEY) } }),
    };
};

export default defineConfig(({ command }) => ({
    plugins: [vue()],
    resolve: {
        // Every workspace library at the source its `@app_/src` export condition names, so an edit is live with no
        // rebuild; outside the repository a consumer gets its dist.
        conditions: [`@app_/src`, ...defaultClientConditions],
    },
    server: serverOptions(command),
    build: {
        outDir: `dist`,
        emptyOutDir: true,
        target: `es2024`,
    },
}));
