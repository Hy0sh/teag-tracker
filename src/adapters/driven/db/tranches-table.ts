import type { Generated } from "kysely";

export type TranchesTable = {
  id: Generated<number>;
  loanId: number;
  position: number;
  type: "PTZ" | "STANDARD";
  principal: number;
  nominalRateBp: number;
  termMonths: number;
};
