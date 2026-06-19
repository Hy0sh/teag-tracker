import type { Cents } from "../cents";

export type RenegotiationFees = {
  origination: Cents; // new bank's file fee (external buyback)
  guarantee: Cents; // caution / mortgage guarantee (external buyback)
  amendment: Cents; // amendment fee (internal renegotiation)
};
