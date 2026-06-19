import type { Option } from "@swan-io/boxed";
import type { Loan } from "../../domain/model/loan";
import type { AmortizationSchedule } from "../../domain/services/amortization-schedule";
import { generateSchedule, readFromSchedule } from "../../domain/services/amortization";
import { standardTranche } from "../../domain/services/renegotiation";
import type { LoanPosition } from "./loan-position";

/**
 * Resolves the current position of the standard (refinanceable) tranche.
 * Uses the real schedule when provided, otherwise generates one from the tranche parameters.
 * Returns undefined when the loan has no standard tranche.
 */
export const resolveStandardPosition = (
  loan: Loan,
  maybeSchedule: Option<AmortizationSchedule>,
  currentMonth: number,
): LoanPosition | undefined => {
  const tranche = standardTranche(loan);
  if (!tranche) return undefined;

  const schedule = maybeSchedule.match({
    Some: (s) => s,
    None: () => generateSchedule(tranche.principal, tranche.nominalRateBp, tranche.termMonths),
  });
  const { outstandingPrincipal, remainingInterest } = readFromSchedule(schedule, currentMonth);
  const remainingMonths = schedule.rows.filter((r) => r.month >= currentMonth).length;

  return { tranche, outstandingPrincipal, remainingInterest, remainingMonths };
};
