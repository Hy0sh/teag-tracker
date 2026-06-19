import type { Scenario } from "./scenario";
import type { RenegotiationFees } from "./renegotiation-fees";
import type { DecisionThreshold } from "./decision-threshold";

export type RenegotiationParams = {
  currentMonth: number;
  scenario: Scenario;
  fees: RenegotiationFees;
  threshold: DecisionThreshold;
};
