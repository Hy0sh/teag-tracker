import { Future, Result } from "@swan-io/boxed";
import type { LoanConfigPort } from "../ports/loan-config.port";
import type { AmortizationSchedulePort } from "../ports/amortization-schedule.port";
import type { AppError } from "../../domain/errors/app-error";
import { ConfigError } from "../../domain/errors/config-error";
import type { ScheduleRow } from "../../domain/services/schedule-row";
import { generateSchedule } from "../../domain/services/amortization";
import { standardTranche } from "../../domain/services/renegotiation";

type Deps = { loanConfig: LoanConfigPort; scheduleProvider: AmortizationSchedulePort };

/** Returns the standard tranche amortization rows — the real schedule when provided, else generated from params. */
export const makeGetSchedule =
  (deps: Deps) =>
  (): Future<Result<ScheduleRow[], AppError>> =>
    deps.loanConfig().flatMapOk((loan) =>
      deps.scheduleProvider().flatMapOk((maybeSchedule) => {
        const tranche = standardTranche(loan);
        if (!tranche) {
          return Future.value(Result.Error(ConfigError("no standard tranche")));
        }
        const schedule = maybeSchedule.match({
          Some: (s) => s,
          None: () => generateSchedule(tranche.principal, tranche.nominalRateBp, tranche.termMonths),
        });
        return Future.value(Result.Ok(schedule.rows));
      }),
    );
