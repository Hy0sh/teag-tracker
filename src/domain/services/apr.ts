import type { Loan } from "../model/loan";
import type { BasisPoints } from "../basis-points";
import { monthlyPayment } from "./amortization";

/**
 * Combined actuarial cash flows of the loan, from the borrower's point of view, per monthly installment.
 * flows[0] = total principal received - upfront fees (positive).
 * flows[k] = -(sum of active tranche payments + insurance) (negative).
 */
export const combinedCashFlows = (loan: Loan): number[] => {
  const maxTerm = loan.tranches.reduce((m, t) => Math.max(m, t.termMonths), 0);
  const totalPrincipal = loan.tranches.reduce((s, t) => s + t.principal, 0);

  const flows: number[] = new Array<number>(maxTerm + 1).fill(0);
  flows[0] = totalPrincipal - loan.upfrontFees;

  for (const tranche of loan.tranches) {
    const payment = monthlyPayment(tranche.principal, tranche.nominalRateBp, tranche.termMonths);
    for (let month = 1; month <= tranche.termMonths; month++) {
      flows[month] = (flows[month] ?? 0) - payment;
    }
  }
  for (let month = 1; month <= maxTerm; month++) {
    flows[month] = (flows[month] ?? 0) - loan.monthlyInsurance;
  }
  return flows;
};

/**
 * Solves by bisection the monthly rate that zeroes the NPV of the cash flows, then annualizes it (actuarial method = APR / TAEG).
 * NPV increases with the rate (flows[0] > 0, later flows < 0) -> single root on [0, upperBound].
 * Returns the APR as integer basis points.
 */
export const computeApr = (flows: number[]): BasisPoints => {
  const npv = (i: number): number => flows.reduce((s, f, k) => s + f / (1 + i) ** k, 0);

  let lo = 0;
  let hi = 1; // 100% monthly: very large upper bound
  for (let iter = 0; iter < 200; iter++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) < 0) lo = mid;
    else hi = mid;
  }
  const monthly = (lo + hi) / 2;
  const annualFraction = (1 + monthly) ** 12 - 1;
  return Math.round(annualFraction * 10_000);
};
