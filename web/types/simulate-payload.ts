import type { Scenario } from "./scenario";

export type SimulatePayload = {
  scenario: Scenario;
  offeredRateBp: number;
  newTermMonths?: number;
};
