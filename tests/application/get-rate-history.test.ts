import { describe, expect, it } from "vitest";
import { Future, Result } from "@swan-io/boxed";
import { makeGetRateHistory } from "../../src/application/use-cases/get-rate-history";
import type { RateHistory } from "../../src/domain/model/rate-history";
import type { RateRepositoryPort } from "../../src/application/ports/rate-repository.port";

describe("get-rate-history use case", () => {
  it("returns the history sorted chronologically", async () => {
    const unsorted: RateHistory = [
      { date: "2026-06", rateBp: 200 },
      { date: "2026-01", rateBp: 300 },
      { date: "2026-03", rateBp: 250 },
    ];
    const repository: RateRepositoryPort = {
      loadHistory: () => Future.value(Result.Ok(unsorted)),
      save: (rates) => Future.value(Result.Ok(rates)),
    };

    const res = await makeGetRateHistory({ repository })().toPromise();

    res.match({
      Ok: (history) => expect(history.map((r) => r.date)).toEqual(["2026-01", "2026-03", "2026-06"]),
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });
});
