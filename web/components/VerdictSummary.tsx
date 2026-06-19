import type { Verdict } from "../types/verdict";
import { eur, pct } from "../format";

export const VerdictSummary = ({ verdict }: { verdict: Verdict }) => {
  const renegotiate = verdict.decision === "RENEGOTIATE";
  return (
    <div>
      <p className={`badge ${renegotiate ? "badge-go" : "badge-wait"}`}>
        {renegotiate ? "RENÉGOCIER" : "ATTENDRE"}
      </p>
      <dl className="grid">
        <dt>Taux actuel (classique)</dt>
        <dd>{pct(verdict.currentRateBp)}</dd>
        <dt>Taux offre</dt>
        <dd>
          {pct(verdict.offeredRateBp)} <span className="muted">(écart {pct(verdict.rateGapBp)})</span>
        </dd>
        <dt>Capital restant dû</dt>
        <dd>
          {eur(verdict.outstandingPrincipal)} <span className="muted">/ {verdict.remainingMonths} mois</span>
        </dd>
        <dt>Intérêts restants — actuel</dt>
        <dd>{eur(verdict.currentRemainingInterest)}</dd>
        <dt>Intérêts restants — offre</dt>
        <dd>{eur(verdict.newRemainingInterest)}</dd>
        <dt>Mensualité à ce taux</dt>
        <dd>{eur(verdict.newMonthlyPayment)} <span className="muted">/ mois</span></dd>
        <dt>Frais (dont IRA {eur(verdict.earlyRepaymentFee)})</dt>
        <dd>{eur(verdict.totalFees)}</dd>
        <dt>
          <strong>Économie nette</strong>
        </dt>
        <dd>
          <strong>{eur(verdict.netSavings)}</strong>
        </dd>
      </dl>
    </div>
  );
};
