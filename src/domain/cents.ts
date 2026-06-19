/**
 * Money convention: every amount is stored and computed in CENTS (integers).
 * Conversion to euros happens only at the boundaries (CLI/HTTP display, config parsing).
 */
export type Cents = number;
