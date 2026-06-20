import { AsyncData, type Result } from "@swan-io/boxed";
import { type SyntheticEvent, useState } from "react";
import { applyEarlyRepayment, earlyRepayment } from "../api-client";
import type { EarlyRepaymentResult } from "../types/early-repayment-result";
import type { RepaymentMode } from "../types/repayment-mode";
import { eur } from "../format";
import { EarlyRepaymentSummary } from "./EarlyRepaymentSummary";

type Operation = "SIMULATE" | "APPLY";

export const EarlyRepaymentForm = () => {
  const [amount, setAmount] = useState("20000");
  const [mode, setMode] = useState<RepaymentMode>("REDUCE_TERM");
  const [operation, setOperation] = useState<Operation>("SIMULATE");
  const [result, setResult] = useState<AsyncData<Result<EarlyRepaymentResult, string>>>(
    AsyncData.NotAsked(),
  );

  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    const payload = { lumpSum: Number(amount), mode };

    if (operation === "APPLY") {
      const ok = window.confirm(
        `Appliquer réellement un remboursement de ${eur(Number(amount) * 100)} ?\nCela modifie ton échéancier en base (irréversible sans réimport).`,
      );
      if (!ok) return;
      setResult(AsyncData.Loading());
      applyEarlyRepayment(payload).onResolve((r) => {
        setResult(AsyncData.Done(r));
        if (r.isOk()) {
          window.alert("Remboursement appliqué : ton échéancier a été mis à jour.");
          window.location.reload();
        }
      });
      return;
    }

    setResult(AsyncData.Loading());
    earlyRepayment(payload).onResolve((r) => setResult(AsyncData.Done(r)));
  };

  const real = operation === "APPLY";

  return (
    <section className="card">
      <h2>Remboursement anticipé partiel</h2>
      <form onSubmit={onSubmit} className="form">
        <label>
          Opération
          <select value={operation} onChange={(e) => setOperation(e.target.value as Operation)}>
            <option value="SIMULATE">Simulation (sans effet)</option>
            <option value="APPLY">Réel — applique et met à jour le prêt</option>
          </select>
        </label>
        <label>
          Montant remboursé (€)
          <input type="number" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label>
          Effet
          <select value={mode} onChange={(e) => setMode(e.target.value as RepaymentMode)}>
            <option value="REDUCE_TERM">Réduire la durée (mensualité conservée)</option>
            <option value="REDUCE_PAYMENT">Réduire la mensualité (durée conservée)</option>
          </select>
        </label>
        <button type="submit" className={real ? "btn-apply" : undefined}>
          {real ? "Appliquer le remboursement" : "Simuler"}
        </button>
        {real && <p className="muted">Action réelle : modifie l'échéancier en base (confirmation demandée).</p>}
      </form>

      {result.match({
        NotAsked: () => null,
        Loading: () => <p className="muted">{real ? "Application…" : "Calcul…"}</p>,
        Done: (r) =>
          r.match({
            Ok: (res) => <EarlyRepaymentSummary res={res} />,
            Error: (message) => <p className="error">Erreur : {message}</p>,
          }),
      })}
    </section>
  );
};
