import { Future, Option, Result } from "@swan-io/boxed";
import type { Db } from "./db/database";
import type { AmortizationSchedule } from "../../domain/services/amortization-schedule";
import type { AmortizationSchedulePort } from "../../application/ports/amortization-schedule.port";
import { ParseError } from "../../domain/errors/parse-error";

export const makePgScheduleProvider =
  (db: Db): AmortizationSchedulePort =>
  () =>
    Future.fromPromise(
      db
        .selectFrom("scheduleRows")
        .select(["month", "payment", "principalPart", "interestPart", "outstandingPrincipal"])
        .orderBy("month")
        .execute(),
    ).map((r): Result<Option<AmortizationSchedule>, ParseError> =>
      r.match({
        // Rows already match ScheduleRow; empty -> degraded mode (Option.None), not an error.
        Ok: (rows) =>
          Result.Ok(rows.length === 0 ? Option.None() : Option.Some({ rows })),
        Error: (e) => Result.Error(ParseError(`load schedule failed: ${String(e)}`)),
      }),
    );
