import type { RepaymentMode } from "./repayment-mode";

export type EarlyRepaymentResult = {
  mode: RepaymentMode;
  lumpSum: number;
  ira: number;
  newOutstanding: number;
  currentRemainingInterest: number;
  newRemainingInterest: number;
  interestSaved: number;
  netSaving: number;
  newMonthlyPayment: number;
  newTermMonths: number;
  monthsSaved: number;
};
