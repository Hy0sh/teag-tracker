import type { Loan } from "../model/loan";
import type { LoanTranche } from "../model/loan-tranche";
import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";
import { bpToFraction } from "../rate";
import type { Decision } from "../model/decision";
import type { DecisionThreshold } from "../model/decision-threshold";
import type { RenegotiationFees } from "../model/renegotiation-fees";
import type { Scenario } from "../model/scenario";
import type { Verdict } from "../model/verdict";
import { generateSchedule, monthlyPayment } from "./amortization";
import type { RenegotiationInput } from "./renegotiation-input";

/** Only the standard tranche is refinanceable - a 0% PTZ is never renegotiated. */
export const standardTranche = (loan: Loan): LoanTranche | undefined =>
  loan.tranches.find((t) => t.type === "STANDARD");

/** Early repayment fee: min(6 months of interest, 3% of outstanding principal). */
export const earlyRepaymentFee = (
  outstandingPrincipal: Cents,
  currentRateBp: BasisPoints,
): Cents =>
  Math.round(
    Math.min(outstandingPrincipal * (bpToFraction(currentRateBp) / 12) * 6, 0.03 * outstandingPrincipal),
  );

const totalInterest = (principal: Cents, annualRateBp: BasisPoints, termMonths: number): Cents =>
  generateSchedule(principal, annualRateBp, termMonths).rows.reduce((s, r) => s + r.interestPart, 0);

export const evaluateRenegotiation = (input: RenegotiationInput): Verdict => {
  const newRemainingInterest = totalInterest(
    input.outstandingPrincipal,
    input.offeredRateBp,
    input.remainingMonths,
  );
  const newMonthlyPayment = monthlyPayment(
    input.outstandingPrincipal,
    input.offeredRateBp,
    input.remainingMonths,
  );
  const erf =
    input.scenario === "EXTERNAL"
      ? earlyRepaymentFee(input.outstandingPrincipal, input.currentRateBp)
      : 0;
  const totalFees =
    input.scenario === "EXTERNAL"
      ? erf + input.fees.origination + input.fees.guarantee
      : input.fees.amendment;
  const netSavings = input.currentRemainingInterest - newRemainingInterest - totalFees;
  const rateGapBp = input.currentRateBp - input.offeredRateBp;
  const decision: Decision =
    netSavings > input.threshold.minNetSavings && rateGapBp > input.threshold.minRateGapBp
      ? "RENEGOTIATE"
      : "WAIT";

  return {
    decision,
    scenario: input.scenario,
    currentRateBp: input.currentRateBp,
    offeredRateBp: input.offeredRateBp,
    rateGapBp,
    outstandingPrincipal: input.outstandingPrincipal,
    remainingMonths: input.remainingMonths,
    currentRemainingInterest: input.currentRemainingInterest,
    newRemainingInterest,
    newMonthlyPayment,
    earlyRepaymentFee: erf,
    totalFees,
    netSavings,
  };
};
