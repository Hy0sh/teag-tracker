/** Cents -> euro string (display only; all amounts travel as integer cents). */
export const eur = (cents: number): string =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** Basis points -> percentage string (display only; all rates travel as integer bp). */
export const pct = (bp: number): string => `${(bp / 100).toFixed(2)} %`;
