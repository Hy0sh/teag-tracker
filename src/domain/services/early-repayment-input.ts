import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";
import type { RepaymentMode } from "../model/repayment-mode";

export type EarlyRepaymentInput = {
  outstandingPrincipal: Cents;
  currentRateBp: BasisPoints;
  remainingMonths: number;
  currentRemainingInterest: Cents;
  lumpSum: Cents;
  mode: RepaymentMode;
};
