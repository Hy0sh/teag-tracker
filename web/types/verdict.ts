import type { Decision } from "./decision";
import type { Scenario } from "./scenario";

export type Verdict = {
  decision: Decision;
  scenario: Scenario;
  currentRateBp: number;
  offeredRateBp: number;
  rateGapBp: number;
  outstandingPrincipal: number;
  remainingMonths: number;
  currentRemainingInterest: number;
  newRemainingInterest: number;
  newMonthlyPayment: number;
  earlyRepaymentFee: number;
  totalFees: number;
  netSavings: number;
};
