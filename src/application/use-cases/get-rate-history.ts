import type { Future, Result } from "@swan-io/boxed";
import type { RateRepositoryPort } from "../ports/rate-repository.port";
import type { RateHistory } from "../../domain/model/rate-history";
import type { StoreError } from "../../domain/errors/store-error";

type Deps = { repository: RateRepositoryPort };

/** Returns the rate history sorted chronologically (for the dashboard chart). */
export const makeGetRateHistory =
  (deps: Deps) =>
  (): Future<Result<RateHistory, StoreError>> =>
    deps.repository
      .loadHistory()
      .mapOk((history) => [...history].sort((a, b) => a.date.localeCompare(b.date)));
