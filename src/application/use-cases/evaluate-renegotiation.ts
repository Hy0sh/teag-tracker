import { Future, Result } from "@swan-io/boxed";
import type { LoanConfigPort } from "../ports/loan-config.port";
import type { RateRepositoryPort } from "../ports/rate-repository.port";
import type { AmortizationSchedulePort } from "../ports/amortization-schedule.port";
import type { AppError } from "../../domain/errors/app-error";
import { ConfigError } from "../../domain/errors/config-error";
import { StoreError } from "../../domain/errors/store-error";
import { latestObservation } from "../../domain/model/market-rate";
import type { Verdict } from "../../domain/model/verdict";
import { evaluateRenegotiation } from "../../domain/services/renegotiation";
import { resolveStandardPosition } from "./shared";
import type { EvaluateInput } from "./evaluate-input";

type Deps = {
  loanConfig: LoanConfigPort;
  rateRepository: RateRepositoryPort;
  scheduleProvider: AmortizationSchedulePort;
};

/** Evaluates whether to renegotiate the standard tranche at the latest market rate (PTZ kept untouched). */
export const makeEvaluateRenegotiation =
  (deps: Deps) =>
  (input: EvaluateInput): Future<Result<Verdict, AppError>> =>
    deps.loanConfig().flatMapOk((loan) =>
      deps.rateRepository.loadHistory().flatMapOk((history) =>
        deps.scheduleProvider().flatMapOk((maybeSchedule) => {
          const position = resolveStandardPosition(loan, maybeSchedule, input.currentMonth);
          if (!position) {
            return Future.value(Result.Error(ConfigError("no standard tranche to renegotiate")));
          }
          const latest = latestObservation(history);
          if (!latest) {
            return Future.value(Result.Error(StoreError("empty rate history")));
          }

          return Future.value(
            Result.Ok(
              evaluateRenegotiation({
                outstandingPrincipal: position.outstandingPrincipal,
                currentRateBp: position.tranche.nominalRateBp,
                offeredRateBp: latest.rateBp,
                remainingMonths: position.remainingMonths,
                currentRemainingInterest: position.remainingInterest,
                scenario: input.scenario,
                fees: input.fees,
                threshold: input.threshold,
              }),
            ),
          );
        }),
      ),
    );
