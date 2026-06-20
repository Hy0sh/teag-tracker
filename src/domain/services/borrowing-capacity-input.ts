import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";

export type BorrowingCapacityInput = {
  monthlyIncome: Cents;
  existingMonthlyDebt: Cents; // current loan payments / charges
  annualRateBp: BasisPoints;
  termMonths: number;
  maxDebtRatioBp: BasisPoints; // e.g. 3500 = 35% (HCSF)
  desiredAmount?: Cents; // optional: "I'd like to borrow X"
};
