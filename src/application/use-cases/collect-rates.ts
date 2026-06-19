import type { Future, Result } from "@swan-io/boxed";
import type { RateSourcePort } from "../ports/rate-source.port";
import type { RateRepositoryPort } from "../ports/rate-repository.port";
import type { RateHistory } from "../../domain/model/rate-history";
import type { AppError } from "../../domain/errors/app-error";

type Deps = { source: RateSourcePort; repository: RateRepositoryPort };

/** Fetches the latest rates from the source and persists them (the repository deduplicates). */
export const makeCollectRates =
  (deps: Deps) =>
  (): Future<Result<RateHistory, AppError>> =>
    deps.source().flatMapOk((rates) => deps.repository.save(rates));
