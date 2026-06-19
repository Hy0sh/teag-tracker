import type { Scenario } from "../../domain/model/scenario";
import type { RenegotiationFees } from "../../domain/model/renegotiation-fees";
import type { DecisionThreshold } from "../../domain/model/decision-threshold";

export type EvaluateInput = {
  currentMonth: number;
  scenario: Scenario;
  fees: RenegotiationFees;
  threshold: DecisionThreshold;
};
