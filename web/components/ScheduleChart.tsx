import type { ScheduleRow } from "../types/schedule-row";
import { eur } from "../format";

const COLOR_PAYMENT = "#2563eb";
const COLOR_CRD = "#16a34a";

export const ScheduleChart = ({ rows }: { rows: ScheduleRow[] }) => {
  if (rows.length === 0) {
    return <p className="muted">Aucun échéancier disponible.</p>;
  }

  const width = 640;
  const height = 220;
  const pad = 40;

  const payments = rows.map((r) => r.payment);
  const crds = rows.map((r) => r.outstandingPrincipal);
  const pMin = Math.min(...payments);
  const pMax = Math.max(...payments);
  const cMin = Math.min(...crds);
  const cMax = Math.max(...crds);

  const x = (i: number) => pad + (i * (width - 2 * pad)) / Math.max(1, rows.length - 1);
  const norm = (v: number, min: number, max: number) =>
    height - pad - ((v - min) / (max - min || 1)) * (height - 2 * pad);

  const line = (vals: number[], min: number, max: number) =>
    vals.map((v, i) => `${x(i)},${norm(v, min, max)}`).join(" ");

  const current = rows[0];
  const change = rows.find((r) => r.payment !== current?.payment);
  const totalRemaining = payments.reduce((s, p) => s + p, 0);
  const outstanding = current ? current.outstandingPrincipal + current.principalPart : 0;

  return (
    <div>
      <div className="legend">
        <span>
          <i style={{ background: COLOR_PAYMENT }} /> Mensualité
        </span>
        <span>
          <i style={{ background: COLOR_CRD }} /> Capital restant dû
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Échéancier">
        <polyline fill="none" stroke={COLOR_PAYMENT} strokeWidth={2} points={line(payments, pMin, pMax)} />
        <polyline fill="none" stroke={COLOR_CRD} strokeWidth={2} points={line(crds, cMin, cMax)} />
        <text x={pad} y={16} fontSize={11} fill={COLOR_PAYMENT}>
          {eur(pMax)}
        </text>
        <text x={pad} y={height - pad + 16} fontSize={11} fill={COLOR_PAYMENT}>
          {eur(pMin)}
        </text>
        <text x={width - pad - 70} y={16} fontSize={11} fill={COLOR_CRD}>
          {eur(cMax)}
        </text>
      </svg>

      <dl className="grid">
        <dt>Mensualité actuelle</dt>
        <dd>{current ? eur(current.payment) : "—"}</dd>
        <dt>Prochaine variation</dt>
        <dd>
          {change ? `${eur(change.payment)} au mois ${change.month}` : "constante"}
        </dd>
        <dt>Durée restante</dt>
        <dd>{rows.length} mois</dd>
        <dt>Capital restant dû</dt>
        <dd>{eur(outstanding)}</dd>
        <dt>
          <strong>Total restant à payer</strong>
        </dt>
        <dd>
          <strong>{eur(totalRemaining)}</strong>
        </dd>
      </dl>
    </div>
  );
};
