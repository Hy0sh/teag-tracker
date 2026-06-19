/**
 * Rate convention: every rate is stored and compared as an integer number of BASIS POINTS.
 * 1 bp = 0.01% ; 3.10% = 310 bp. The decimal fraction (bp / 10000) is only used transiently
 * inside a computation, never stored nor compared — this keeps rate equality/dedup exact.
 */
export type BasisPoints = number;
