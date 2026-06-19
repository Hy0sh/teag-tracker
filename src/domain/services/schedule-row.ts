import type { Cents } from "../cents";

export type ScheduleRow = {
  month: number;
  payment: Cents;
  principalPart: Cents;
  interestPart: Cents;
  outstandingPrincipal: Cents; // remaining principal after this installment
};
