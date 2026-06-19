import { describe, expect, it } from "vitest";
import { Future, Result } from "@swan-io/boxed";
import { makeCollectRates } from "../../src/application/use-cases/collect-rates";
import type { MarketRate } from "../../src/domain/model/market-rate-type";
import type { RateSourcePort } from "../../src/application/ports/rate-source.port";
import type { RateRepositoryPort } from "../../src/application/ports/rate-repository.port";
import { FetchError } from "../../src/domain/errors/fetch-error";

describe("collect-rates use case", () => {
  it("fetches from the source and hands the rates to the repository", async () => {
    const fetched: MarketRate[] = [{ date: "2026-06", rateBp: 310 }];
    let saved: MarketRate[] | undefined;

    const source: RateSourcePort = () => Future.value(Result.Ok(fetched));
    const repository: RateRepositoryPort = {
      loadHistory: () => Future.value(Result.Ok([])),
      save: (rates) => {
        saved = rates;
        return Future.value(Result.Ok(rates));
      },
    };

    const res = await makeCollectRates({ source, repository })().toPromise();

    expect(saved).toEqual(fetched);
    expect(res.isOk()).toBe(true);
  });

  it("propagates a source fetch error", async () => {
    const source: RateSourcePort = () => Future.value(Result.Error(FetchError("network down")));
    const repository: RateRepositoryPort = {
      loadHistory: () => Future.value(Result.Ok([])),
      save: (rates) => Future.value(Result.Ok(rates)),
    };

    const res = await makeCollectRates({ source, repository })().toPromise();
    expect(res.isError()).toBe(true);
  });
});
