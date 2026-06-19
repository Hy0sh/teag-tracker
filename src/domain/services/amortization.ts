import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";
import { bpToFraction } from "../rate";
import type { ScheduleRow } from "./schedule-row";
import type { AmortizationSchedule } from "./amortization-schedule";

/** Monthly payment of a fixed-rate amortizing loan. PTZ (rate 0) -> principal / term. Result in integer cents. */
export const monthlyPayment = (
  principal: Cents,
  annualRateBp: BasisPoints,
  termMonths: number,
): Cents => {
  if (termMonths <= 0) return 0;
  const t = bpToFraction(annualRateBp) / 12;
  if (t === 0) return Math.round(principal / termMonths);
  return Math.round((principal * t) / (1 - (1 + t) ** -termMonths));
};

/** Generates the theoretical amortization schedule of a tranche (used for a simulated offer). Integer cents, last row clears the balance. */
export const generateSchedule = (
  principal: Cents,
  annualRateBp: BasisPoints,
  termMonths: number,
): AmortizationSchedule => {
  const t = bpToFraction(annualRateBp) / 12;
  const payment = monthlyPayment(principal, annualRateBp, termMonths);
  const rows: ScheduleRow[] = [];
  let outstanding = principal;
  for (let month = 1; month <= termMonths; month++) {
    const interestPart = Math.round(outstanding * t);
    const isLast = month === termMonths;
    const principalPart = isLast ? outstanding : payment - interestPart;
    outstanding = Math.max(0, outstanding - principalPart);
    rows.push({
      month,
      payment: isLast ? principalPart + interestPart : payment,
      principalPart,
      interestPart,
      outstandingPrincipal: outstanding,
    });
  }
  return { rows };
};

/** Reads the exact outstanding principal and remaining interest from a real schedule, from a given month (inclusive). */
export const readFromSchedule = (
  schedule: AmortizationSchedule,
  fromMonth: number,
): { outstandingPrincipal: Cents; remainingInterest: Cents } => {
  const remaining = schedule.rows.filter((r) => r.month >= fromMonth);
  const remainingInterest = remaining.reduce((s, r) => s + r.interestPart, 0);
  const first = remaining[0];
  const outstandingPrincipal = first ? first.outstandingPrincipal + first.principalPart : 0;
  return { outstandingPrincipal, remainingInterest };
};
