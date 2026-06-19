import type { Future, Option, Result } from "@swan-io/boxed";
import type { AmortizationSchedule } from "../../domain/services/amortization-schedule";
import type { ParseError } from "../../domain/errors/parse-error";

/** Loads the borrower's real amortization schedule. Absent schedule is `Option.None`, not an error. */
export type AmortizationSchedulePort = () => Future<Result<Option<AmortizationSchedule>, ParseError>>;
