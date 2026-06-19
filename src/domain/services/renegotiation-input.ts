import type { Cents } from "../cents";
import type { BasisPoints } from "../basis-points";
import type { Scenario } from "../model/scenario";
import type { RenegotiationFees } from "../model/renegotiation-fees";
import type { DecisionThreshold } from "../model/decision-threshold";

export type RenegotiationInput = {
  outstandingPrincipal: Cents;
  currentRateBp: BasisPoints;
  offeredRateBp: BasisPoints;
  remainingMonths: number;
  currentRemainingInterest: Cents;
  scenario: Scenario;
  fees: RenegotiationFees;
  threshold: DecisionThreshold;
};
