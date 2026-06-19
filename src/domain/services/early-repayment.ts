import { bpToFraction } from "../rate";
import { generateSchedule, monthlyPayment } from "./amortization";
import { earlyRepaymentFee } from "./renegotiation";
import type { EarlyRepaymentInput } from "./early-repayment-input";
import type { EarlyRepaymentResult } from "../model/early-repayment-result";
import type { AmortizationSchedule } from "./amortization-schedule";

/** Term (in months) needed to amortize `outstanding` at `rateBp` while keeping `payment`. */
const termForPayment = (outstanding: number, rateBp: number, payment: number): number => {
  const t = bpToFraction(rateBp) / 12;
  if (t === 0) return Math.ceil(outstanding / payment);
  return Math.ceil(-Math.log(1 - (outstanding * t) / payment) / Math.log(1 + t));
};

/**
 * Simulates a partial early repayment of principal on the standard tranche, at the current rate.
 * REDUCE_PAYMENT keeps the remaining term and lowers the monthly payment.
 * REDUCE_TERM keeps the (level-equivalent) monthly payment and shortens the term.
 */
export const simulateEarlyRepayment = (input: EarlyRepaymentInput): EarlyRepaymentResult => {
  const newOutstanding = Math.max(0, input.outstandingPrincipal - input.lumpSum);
  const ira = earlyRepaymentFee(input.lumpSum, input.currentRateBp);

  let newMonthlyPayment: number;
  let newTermMonths: number;
  let newRemainingInterest: number;

  if (newOutstanding === 0) {
    newMonthlyPayment = 0;
    newTermMonths = 0;
    newRemainingInterest = 0;
  } else if (input.mode === "REDUCE_PAYMENT") {
    newTermMonths = input.remainingMonths;
    newMonthlyPayment = monthlyPayment(newOutstanding, input.currentRateBp, input.remainingMonths);
    newRemainingInterest = generateSchedule(
      newOutstanding,
      input.currentRateBp,
      input.remainingMonths,
    ).rows.reduce((s, r) => s + r.interestPart, 0);
  } else {
    const keptPayment = monthlyPayment(
      input.outstandingPrincipal,
      input.currentRateBp,
      input.remainingMonths,
    );
    newMonthlyPayment = keptPayment;
    newTermMonths = termForPayment(newOutstanding, input.currentRateBp, keptPayment);
    newRemainingInterest = Math.max(0, keptPayment * newTermMonths - newOutstanding);
  }

  const interestSaved = input.currentRemainingInterest - newRemainingInterest;

  return {
    mode: input.mode,
    lumpSum: input.lumpSum,
    ira,
    newOutstanding,
    currentRemainingInterest: input.currentRemainingInterest,
    newRemainingInterest,
    interestSaved,
    netSaving: interestSaved - ira,
    newMonthlyPayment,
    newTermMonths,
    monthsSaved: input.remainingMonths - newTermMonths,
  };
};

/** The new amortization schedule after the early repayment is actually applied. */
export const earlyRepaymentSchedule = (input: EarlyRepaymentInput): AmortizationSchedule => {
  const { newOutstanding, newTermMonths } = simulateEarlyRepayment(input);
  if (newOutstanding === 0 || newTermMonths === 0) return { rows: [] };
  return generateSchedule(newOutstanding, input.currentRateBp, newTermMonths);
};
