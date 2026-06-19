import { Future, Result } from "@swan-io/boxed";
import type { LoanConfigPort } from "../ports/loan-config.port";
import type { AmortizationSchedulePort } from "../ports/amortization-schedule.port";
import type { AppError } from "../../domain/errors/app-error";
import { ConfigError } from "../../domain/errors/config-error";
import type { Verdict } from "../../domain/model/verdict";
import { evaluateRenegotiation } from "../../domain/services/renegotiation";
import { resolveStandardPosition } from "./shared";
import type { SimulateInput } from "./simulate-input";

type Deps = { loanConfig: LoanConfigPort; scheduleProvider: AmortizationSchedulePort };

/** Replays the renegotiation calculation with user-chosen parameters (offered rate, new term, scenario). */
export const makeSimulateScenario =
  (deps: Deps) =>
  (input: SimulateInput): Future<Result<Verdict, AppError>> =>
    deps.loanConfig().flatMapOk((loan) =>
      deps.scheduleProvider().flatMapOk((maybeSchedule) => {
        const position = resolveStandardPosition(loan, maybeSchedule, input.currentMonth);
        if (!position) {
          return Future.value(Result.Error(ConfigError("no standard tranche to renegotiate")));
        }
        return Future.value(
          Result.Ok(
            evaluateRenegotiation({
              outstandingPrincipal: position.outstandingPrincipal,
              currentRateBp: position.tranche.nominalRateBp,
              offeredRateBp: input.offeredRateBp,
              remainingMonths: input.newTermMonths ?? position.remainingMonths,
              currentRemainingInterest: position.remainingInterest,
              scenario: input.scenario,
              fees: input.fees,
              threshold: input.threshold,
            }),
          ),
        );
      }),
    );
