import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";

export type BorrowingCapacityResult = {
  maxMonthlyPayment: Cents; // available monthly capacity for a new loan
  currentDebtRatioBp: BasisPoints; // existing debt / income
  borrowableAmount: Cents; // max capital financeable over the chosen term

  // present only when a desired amount was provided
  desiredAmount?: Cents;
  desiredMonthlyPayment?: Cents;
  desiredFits?: boolean;
  desiredDebtRatioBp?: BasisPoints;
};
