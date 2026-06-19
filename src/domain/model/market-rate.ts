import type { MarketRate } from "./market-rate-type";
import type { RateHistory } from "./rate-history";

/** Most recent observation (lexicographic sort of ISO "YYYY-MM" dates). */
export const latestObservation = (history: RateHistory): MarketRate | undefined =>
  [...history].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
