import type { EarlyRepaymentResult } from "../types/early-repayment-result";
import { eur } from "../format";

export const EarlyRepaymentSummary = ({ res }: { res: EarlyRepaymentResult }) => (
  <dl className="grid">
    <dt>Indemnité (IRA)</dt>
    <dd>{eur(res.ira)}</dd>
    <dt>Capital restant après</dt>
    <dd>{eur(res.newOutstanding)}</dd>
    {res.mode === "REDUCE_TERM" ? (
      <>
        <dt>Nouvelle durée</dt>
        <dd>
          {res.newTermMonths} mois <span className="muted">(−{res.monthsSaved} mois)</span>
        </dd>
      </>
    ) : (
      <>
        <dt>Nouvelle mensualité</dt>
        <dd>{eur(res.newMonthlyPayment)} / mois</dd>
      </>
    )}
    <dt>Intérêts économisés</dt>
    <dd>{eur(res.interestSaved)}</dd>
    <dt>
      <strong>Gain net (intérêts − IRA)</strong>
    </dt>
    <dd>
      <strong>{eur(res.netSaving)}</strong>
    </dd>
  </dl>
);
