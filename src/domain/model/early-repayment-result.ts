import type { Cents } from "../cents";
import type { RepaymentMode } from "./repayment-mode";

export type EarlyRepaymentResult = {
  mode: RepaymentMode;
  lumpSum: Cents;
  ira: Cents; // early repayment fee on the lump sum
  newOutstanding: Cents;
  currentRemainingInterest: Cents;
  newRemainingInterest: Cents;
  interestSaved: Cents; // currentRemainingInterest - newRemainingInterest
  netSaving: Cents; // interestSaved - ira
  newMonthlyPayment: Cents; // REDUCE_PAYMENT: lowered ; REDUCE_TERM: kept (unchanged)
  newTermMonths: number; // REDUCE_TERM: shortened ; REDUCE_PAYMENT: unchanged
  monthsSaved: number;
};
