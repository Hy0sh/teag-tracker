import type { Future, Result } from "@swan-io/boxed";
import type { LoanConfigPort } from "../ports/loan-config.port";
import type { ConfigError } from "../../domain/errors/config-error";
import { combinedCashFlows, computeApr } from "../../domain/services/apr";
import type { InitialApr } from "./initial-apr";

/** Determines the loan's initial APR (TAEG, insurance included) for the composite loan, in basis points. */
export const makeComputeInitialApr =
  (deps: { loanConfig: LoanConfigPort }) =>
  (): Future<Result<InitialApr, ConfigError>> =>
    deps.loanConfig().mapOk((loan) => ({ aprBp: computeApr(combinedCashFlows(loan)) }));
