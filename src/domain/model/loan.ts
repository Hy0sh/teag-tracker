import type { Cents } from "../cents";
import type { LoanTranche } from "./loan-tranche";

export type Loan = {
  tranches: LoanTranche[];
  upfrontFees: Cents; // origination + guarantee fees paid at inception
  monthlyInsurance: Cents; // borrower insurance cost per month
};
