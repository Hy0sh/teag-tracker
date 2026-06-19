import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { buildApp } from "../../../composition-root";
import type { SimulateInput } from "../../../application/use-cases/simulate-input";
import { toCents } from "../../../domain/money";

export const buildHttpApp = (): Hono => {
  const app = buildApp();
  const api = new Hono();

  api.get("/api/rates", async (c) => {
    const result = await app.getRateHistory().toPromise();
    return result.match({
      Ok: (history) => c.json(history),
      Error: (e) => c.json({ error: e.message }, 500),
    });
  });

  api.get("/api/schedule", async (c) => {
    const result = await app.getSchedule().toPromise();
    return result.match({
      Ok: (rows) => c.json(rows),
      Error: (e) => c.json({ error: e.message }, 500),
    });
  });

  api.get("/api/verdict", async (c) => {
    const result = await app
      .loadRenegotiationParams()
      .flatMapOk((params) =>
        app.computeInitialApr().flatMapOk((teg) =>
          app
            .evaluateRenegotiation({
              currentMonth: params.currentMonth,
              scenario: params.scenario,
              fees: params.fees,
              threshold: params.threshold,
            })
            .mapOk((verdict) => ({ aprBp: teg.aprBp, verdict })),
        ),
      )
      .toPromise();
    return result.match({
      Ok: (data) => c.json(data),
      Error: (e) => c.json({ error: e.message }, 500),
    });
  });

  api.post("/api/simulate", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await app
      .loadRenegotiationParams()
      .flatMapOk((params) => {
        const input: SimulateInput = {
          currentMonth: params.currentMonth,
          scenario: body.scenario === "INTERNAL" ? "INTERNAL" : "EXTERNAL",
          offeredRateBp: Number(body.offeredRateBp),
          fees: params.fees,
          threshold: params.threshold,
          ...(body.newTermMonths ? { newTermMonths: Number(body.newTermMonths) } : {}),
        };
        return app.simulateScenario(input);
      })
      .toPromise();
    return result.match({
      Ok: (verdict) => c.json(verdict),
      Error: (e) => c.json({ error: e.message }, 500),
    });
  });

  api.post("/api/early-repayment", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await app
      .loadRenegotiationParams()
      .flatMapOk((params) =>
        app.simulateEarlyRepayment({
          currentMonth: params.currentMonth,
          lumpSum: toCents(Number(body.lumpSum)),
          mode: body.mode === "REDUCE_PAYMENT" ? "REDUCE_PAYMENT" : "REDUCE_TERM",
        }),
      )
      .toPromise();
    return result.match({
      Ok: (r) => c.json(r),
      Error: (e) => c.json({ error: e.message }, 500),
    });
  });

  api.post("/api/early-repayment/apply", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await app
      .loadRenegotiationParams()
      .flatMapOk((params) =>
        app.applyEarlyRepayment({
          currentMonth: params.currentMonth,
          lumpSum: toCents(Number(body.lumpSum)),
          mode: body.mode === "REDUCE_PAYMENT" ? "REDUCE_PAYMENT" : "REDUCE_TERM",
        }),
      )
      .toPromise();
    return result.match({
      Ok: (r) => c.json(r),
      Error: (e) => c.json({ error: e.message }, 500),
    });
  });

  // Serve the built React dashboard (web/dist) for everything else.
  api.use("/*", serveStatic({ root: "./web/dist" }));

  return api;
};

export const startServer = (port: number = Number(process.env.PORT ?? 3000)): void => {
  serve({ fetch: buildHttpApp().fetch, port }, (info) => {
    console.log(`Dashboard TEG Tracker sur http://localhost:${info.port}`);
  });
};
