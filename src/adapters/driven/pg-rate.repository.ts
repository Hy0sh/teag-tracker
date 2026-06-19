import { Future, Result } from "@swan-io/boxed";
import type { Db } from "./db/database";
import type { RateHistory } from "../../domain/model/rate-history";
import type { RateRepositoryPort } from "../../application/ports/rate-repository.port";
import { StoreError } from "../../domain/errors/store-error";

// `marketRates` rows are { date, rateBp } — i.e. MarketRate, so no mapping needed.
const selectAll = (db: Db) =>
  db.selectFrom("marketRates").select(["date", "rateBp"]).orderBy("date").execute();

export const makePgRateRepository = (db: Db): RateRepositoryPort => ({
  loadHistory: () =>
    Future.fromPromise(selectAll(db)).map((r) =>
      r.match({
        Ok: (rows) => Result.Ok<RateHistory, StoreError>(rows),
        Error: (e) => Result.Error(StoreError(`load rates failed: ${String(e)}`)),
      }),
    ),
  save: (rates) =>
    Future.fromPromise(
      (async () => {
        if (rates.length > 0) {
          await db
            .insertInto("marketRates")
            .values(rates)
            .onConflict((oc) =>
              oc.column("date").doUpdateSet((eb) => ({ rateBp: eb.ref("excluded.rateBp") })),
            )
            .execute();
        }
        return selectAll(db);
      })(),
    ).map((r) =>
      r.match({
        Ok: (rows) => Result.Ok<RateHistory, StoreError>(rows),
        Error: (e) => Result.Error(StoreError(`save rates failed: ${String(e)}`)),
      }),
    ),
});
