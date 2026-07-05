import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// Resolve a path relative to this config file (which lives at the app root, _apps/web/).
const here = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// The intentic sandbox injects PORT when it runs this app as an operator panel: it fronts us with its own tunnel
// TLS and speaks plain http to 127.0.0.1:PORT, reaching us on the wildcard host <repo>.preview.<zone>. So under
// the sandbox we bind all interfaces, accept any Host, and serve http; standalone dev keeps localhost + the
// committed dev cert (https:4701 -> https:6480 shares a trust chain so the session cookie rides along).
const underSandbox = process.env.PORT !== undefined;

export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        // Source-first workspace: resolve the libs to their .ts/.vue source, mirroring the tsconfig paths so
        // an edit in _libs reflects here with no rebuild (and Vue-SFC HMR works across the package boundary).
        alias: {
            "@app_/ui": here("../../_libs/ui/src/index.ts"),
            "@app_/api-contract": here("../../_libs/api-contract/src/index.ts"),
        },
    },
    server: {
        host: underSandbox ? "0.0.0.0" : "localhost",
        // Defaults to 4701 for standalone local dev (the API's CORS + Better Auth trust WEB_ORIGIN there); the
        // intentic sandbox injects PORT so multiple app instances get distinct ports behind the preview proxy.
        port: Number(process.env.PORT) || 4701,
        strictPort: true,
        // ponytail: HMR rides the same tunnel host; if the ws fails to connect in a real sandbox, set
        // server.hmr.clientPort to the tunnel's public port.
        ...(underSandbox
            ? { allowedHosts: true }
            : {
                  https: {
                      cert: readFileSync(here("./node_modules/@app_/localhost-https/localhost.crt")),
                      key: readFileSync(here("./node_modules/@app_/localhost-https/localhost.key")),
                  },
              }),
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        target: "es2024",
    },
});
