import type { Future, Result } from "@swan-io/boxed";
import type { MarketRate } from "../../domain/model/market-rate-type";
import type { FetchError } from "../../domain/errors/fetch-error";

export type RateSourcePort = () => Future<Result<MarketRate[], FetchError>>;
