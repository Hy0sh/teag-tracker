import type { Generated } from "kysely";

export type LoansTable = {
  id: Generated<number>;
  upfrontFees: number;
  monthlyInsurance: number;
  currentMonth: number;
  scenario: "EXTERNAL" | "INTERNAL";
  feeOrigination: number;
  feeGuarantee: number;
  feeAmendment: number;
  minNetSavings: number;
  minRateGapBp: number;
};
