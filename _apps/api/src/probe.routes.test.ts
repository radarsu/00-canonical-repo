import { describe, expect, test } from "bun:test";
import { probeRoutes } from "./probe.routes.js";

describe(`GET /health`, () => {
    test(`answers ok while the database answers`, async () => {
        const response = await probeRoutes({ ping: async () => {} }).request(`/health`);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status: `ok` });
    });

    test(`answers 503 with the reason when the database does not`, async () => {
        const ping = async () => {
            throw new Error(`connection refused`);
        };
        const response = await probeRoutes({ ping }).request(`/health`);
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ status: `error`, message: `connection refused` });
    });
});
