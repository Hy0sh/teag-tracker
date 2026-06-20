import type { BorrowingCapacityResult } from "../types/borrowing-capacity-result";
import { eur } from "../format";

const ratio = (bp: number) => `${(bp / 100).toFixed(1)} %`;

export const CapacitySummary = ({ res }: { res: BorrowingCapacityResult }) => (
  <dl className="grid">
    <dt>Capacité mensuelle</dt>
    <dd>{eur(res.maxMonthlyPayment)} / mois</dd>
    <dt>Taux d'endettement actuel</dt>
    <dd>{ratio(res.currentDebtRatioBp)}</dd>
    <dt>
      <strong>Montant empruntable</strong>
    </dt>
    <dd>
      <strong>{eur(res.borrowableAmount)}</strong>
    </dd>
    {res.desiredAmount != null && (
      <>
        <dt>Montant souhaité</dt>
        <dd>{eur(res.desiredAmount)}</dd>
        <dt>Mensualité</dt>
        <dd>{eur(res.desiredMonthlyPayment ?? 0)} / mois</dd>
        <dt>Endettement résultant</dt>
        <dd>{ratio(res.desiredDebtRatioBp ?? 0)}</dd>
        <dt>Faisabilité</dt>
        <dd>
          <span className={`badge ${res.desiredFits ? "badge-go" : "badge-wait"}`}>
            {res.desiredFits ? "DANS LA CAPACITÉ" : "DÉPASSE"}
          </span>
        </dd>
      </>
    )}
  </dl>
);
