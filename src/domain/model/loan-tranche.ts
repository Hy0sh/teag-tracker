import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";
import type { TrancheType } from "./tranche-type";

export type LoanTranche = {
  type: TrancheType;
  principal: Cents; // amount borrowed on this tranche
  nominalRateBp: BasisPoints; // annual nominal rate in basis points (PTZ = 0)
  termMonths: number;
};
