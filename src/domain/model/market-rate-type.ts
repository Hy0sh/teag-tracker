import type { BasisPoints } from "../basis-points";

export type MarketRate = {
  date: string; // "YYYY-MM"
  rateBp: BasisPoints; // annual rate in basis points, e.g. 310 for 3.10%
};
