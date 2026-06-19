import type { Cents } from "./cents";

/** Euros (possibly fractional) -> integer cents. */
export const toCents = (amount: number): Cents => Math.round(amount * 100);

/** Cents -> euros (number, for display computations). */
export const toEuros = (cents: Cents): number => cents / 100;

/** Cents -> French-formatted euro string (e.g. "1 234,56 €"). */
export const formatEuros = (cents: Cents): string =>
  toEuros(cents).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
