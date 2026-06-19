import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";

export type DecisionThreshold = {
  minNetSavings: Cents; // minimum net savings to switch to RENEGOTIATE
  minRateGapBp: BasisPoints; // minimum rate gap in basis points (e.g. 50 = 0.5pt)
};
