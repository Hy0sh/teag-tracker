import { Future, Result } from "@swan-io/boxed";
import type { LoanConfigPort } from "../ports/loan-config.port";
import type { AmortizationSchedulePort } from "../ports/amortization-schedule.port";
import type { AppError } from "../../domain/errors/app-error";
import { ConfigError } from "../../domain/errors/config-error";
import type { EarlyRepaymentResult } from "../../domain/model/early-repayment-result";
import { simulateEarlyRepayment } from "../../domain/services/early-repayment";
import { resolveStandardPosition } from "./shared";
import type { SimulateEarlyRepaymentInput } from "./simulate-early-repayment-input";

type Deps = { loanConfig: LoanConfigPort; scheduleProvider: AmortizationSchedulePort };

/** Simulates a partial early repayment on the standard tranche (current rate, real schedule). */
export const makeSimulateEarlyRepayment =
  (deps: Deps) =>
  (input: SimulateEarlyRepaymentInput): Future<Result<EarlyRepaymentResult, AppError>> =>
    deps.loanConfig().flatMapOk((loan) =>
      deps.scheduleProvider().flatMapOk((maybeSchedule) => {
        const position = resolveStandardPosition(loan, maybeSchedule, input.currentMonth);
        if (!position) {
          return Future.value(Result.Error(ConfigError("no standard tranche")));
        }
        return Future.value(
          Result.Ok(
            simulateEarlyRepayment({
              outstandingPrincipal: position.outstandingPrincipal,
              currentRateBp: position.tranche.nominalRateBp,
              remainingMonths: position.remainingMonths,
              lumpSum: input.lumpSum,
              mode: input.mode,
            }),
          ),
        );
      }),
    );
