import { Future, Result } from "@swan-io/boxed";
import type { LoanConfigPort } from "../ports/loan-config.port";
import type { AmortizationSchedulePort } from "../ports/amortization-schedule.port";
import type { ScheduleWriterPort } from "../ports/schedule-writer.port";
import type { AppError } from "../../domain/errors/app-error";
import { ConfigError } from "../../domain/errors/config-error";
import type { EarlyRepaymentResult } from "../../domain/model/early-repayment-result";
import {
  earlyRepaymentSchedule,
  simulateEarlyRepayment,
} from "../../domain/services/early-repayment";
import { resolveStandardPosition } from "./shared";
import type { SimulateEarlyRepaymentInput } from "./simulate-early-repayment-input";

type Deps = {
  loanConfig: LoanConfigPort;
  scheduleProvider: AmortizationSchedulePort;
  scheduleWriter: ScheduleWriterPort;
};

/** Applies a partial early repayment: persists the recomputed schedule, then returns the result. */
export const makeApplyEarlyRepayment =
  (deps: Deps) =>
  (input: SimulateEarlyRepaymentInput): Future<Result<EarlyRepaymentResult, AppError>> =>
    deps.loanConfig().flatMapOk((loan) =>
      deps.scheduleProvider().flatMapOk((maybeSchedule): Future<Result<EarlyRepaymentResult, AppError>> => {
        const position = resolveStandardPosition(loan, maybeSchedule, input.currentMonth);
        if (!position) {
          return Future.value(Result.Error(ConfigError("no standard tranche")));
        }
        const params = {
          outstandingPrincipal: position.outstandingPrincipal,
          currentRateBp: position.tranche.nominalRateBp,
          remainingMonths: position.remainingMonths,
          currentRemainingInterest: position.remainingInterest,
          lumpSum: input.lumpSum,
          mode: input.mode,
        };
        const result = simulateEarlyRepayment(params);
        return deps.scheduleWriter(earlyRepaymentSchedule(params).rows).mapOk(() => result);
      }),
    );
