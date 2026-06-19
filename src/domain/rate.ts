import type { BasisPoints } from "./basis-points";

/** Percent (e.g. 3.5 for 3.5%) -> integer basis points (350). */
export const percentToBp = (percent: number): BasisPoints => Math.round(percent * 100);

/** Basis points -> decimal fraction for math (310 -> 0.031). Transient use only. */
export const bpToFraction = (bp: BasisPoints): number => bp / 10_000;

/** Basis points -> formatted percentage string (310 -> "3.10 %"). */
export const formatRate = (bp: BasisPoints): string => `${(bp / 100).toFixed(2)} %`;
