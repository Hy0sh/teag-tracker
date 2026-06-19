import type { Cents } from "../../domain/cents";
import type { LoanTranche } from "../../domain/model/loan-tranche";

export type LoanPosition = {
  tranche: LoanTranche;
  outstandingPrincipal: Cents;
  remainingInterest: Cents;
  remainingMonths: number;
};
