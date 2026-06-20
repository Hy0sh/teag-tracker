import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";
import { bpToFraction } from "../rate";
import { monthlyPayment } from "./amortization";
import type { BorrowingCapacityInput } from "./borrowing-capacity-input";
import type { BorrowingCapacityResult } from "../model/borrowing-capacity-result";

/** Max capital financeable by a given monthly payment: C = P * (1 - (1+t)^-n) / t. */
const borrowableFor = (payment: Cents, annualRateBp: BasisPoints, months: number): Cents => {
  if (months <= 0 || payment <= 0) return 0;
  const t = bpToFraction(annualRateBp) / 12;
  if (t === 0) return Math.round(payment * months);
  return Math.round((payment * (1 - (1 + t) ** -months)) / t);
};

const ratioBp = (debt: Cents, income: Cents): BasisPoints =>
  income > 0 ? Math.round((debt / income) * 10_000) : 0;

/** Borrowing capacity from income, existing debt and a max debt-to-income ratio (HCSF 35%). */
export const computeBorrowingCapacity = (
  input: BorrowingCapacityInput,
): BorrowingCapacityResult => {
  const maxTotalPayment = Math.round(input.monthlyIncome * bpToFraction(input.maxDebtRatioBp));
  const maxMonthlyPayment = Math.max(0, maxTotalPayment - input.existingMonthlyDebt);

  const base: BorrowingCapacityResult = {
    maxMonthlyPayment,
    currentDebtRatioBp: ratioBp(input.existingMonthlyDebt, input.monthlyIncome),
    borrowableAmount: borrowableFor(maxMonthlyPayment, input.annualRateBp, input.termMonths),
  };

  if (input.desiredAmount == null) return base;

  const desiredMonthlyPayment = monthlyPayment(
    input.desiredAmount,
    input.annualRateBp,
    input.termMonths,
  );
  return {
    ...base,
    desiredAmount: input.desiredAmount,
    desiredMonthlyPayment,
    desiredFits: desiredMonthlyPayment <= maxMonthlyPayment,
    desiredDebtRatioBp: ratioBp(input.existingMonthlyDebt + desiredMonthlyPayment, input.monthlyIncome),
  };
};
