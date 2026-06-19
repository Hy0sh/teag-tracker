import type { Future, Result } from "@swan-io/boxed";
import type { MarketRate } from "../../domain/model/market-rate-type";
import type { RateHistory } from "../../domain/model/rate-history";
import type { StoreError } from "../../domain/errors/store-error";

export type RateRepositoryPort = {
  loadHistory: () => Future<Result<RateHistory, StoreError>>;
  save: (rates: MarketRate[]) => Future<Result<RateHistory, StoreError>>;
};
