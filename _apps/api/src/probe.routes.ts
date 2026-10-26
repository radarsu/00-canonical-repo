import { Hono } from "hono";

// The unauthenticated liveness probe: one round trip to the database, so a deploy that waits on /health waits for a
// server that can actually serve.
export const probeRoutes = ({ ping }: { readonly ping: () => Promise<void> }) => {
    const app = new Hono();
    app.get(`/health`, async (c) => {
        try {
            await ping();
            return c.json({ status: `ok` });
        } catch (error) {
            return c.json({ status: `error`, message: error instanceof Error ? error.message : `unknown` }, 503);
        }
    });
    return app;
};
