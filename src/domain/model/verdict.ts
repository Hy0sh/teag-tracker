import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";
import type { Decision } from "./decision";
import type { Scenario } from "./scenario";

export type Verdict = {
  decision: Decision;
  scenario: Scenario;
  currentRateBp: BasisPoints;
  offeredRateBp: BasisPoints;
  rateGapBp: BasisPoints;
  outstandingPrincipal: Cents;
  remainingMonths: number;
  currentRemainingInterest: Cents;
  newRemainingInterest: Cents;
  newMonthlyPayment: Cents; // mensualité de la nouvelle offre (hors assurance) au taux comparé
  earlyRepaymentFee: Cents;
  totalFees: Cents;
  netSavings: Cents;
};
