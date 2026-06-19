import type { Cents } from "../../domain/cents";
import type { RepaymentMode } from "../../domain/model/repayment-mode";

export type SimulateEarlyRepaymentInput = {
  currentMonth: number;
  lumpSum: Cents;
  mode: RepaymentMode;
};
