import { AsyncData, type Result } from "@swan-io/boxed";
import { type FormEvent, useState } from "react";
import { computeCapacity } from "../api-client";
import type { BorrowingCapacityResult } from "../types/borrowing-capacity-result";
import { CapacitySummary } from "./CapacitySummary";

export const CapacityForm = ({ defaultRatePercent }: { defaultRatePercent: string }) => {
  const [income, setIncome] = useState("4000");
  const [debt, setDebt] = useState("0");
  const [rate, setRate] = useState(defaultRatePercent);
  const [years, setYears] = useState("20");
  const [maxRatio, setMaxRatio] = useState("35");
  const [desired, setDesired] = useState("");
  const [result, setResult] = useState<AsyncData<Result<BorrowingCapacityResult, string>>>(
    AsyncData.NotAsked(),
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResult(AsyncData.Loading());
    const desiredAmount = desired.trim() === "" ? undefined : Number(desired);
    computeCapacity({
      monthlyIncome: Number(income),
      existingMonthlyDebt: Number(debt),
      annualRatePercent: Number(rate),
      termMonths: Math.round(Number(years) * 12),
      maxDebtRatioPercent: Number(maxRatio),
      ...(desiredAmount ? { desiredAmount } : {}),
    }).onResolve((r) => setResult(AsyncData.Done(r)));
  };

  return (
    <section className="card">
      <h2>Capacité d'emprunt</h2>
      <p className="muted">
        Anticipe un futur prêt (ex. travaux) : renseigne tes revenus et charges, choisis une durée.
      </p>
      <form onSubmit={onSubmit} className="form">
        <label>
          Revenus mensuels (€)
          <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} />
        </label>
        <label>
          Emprunts / charges actuels (€/mois)
          <input type="number" value={debt} onChange={(e) => setDebt(e.target.value)} />
        </label>
        <label>
          Taux envisagé (%)
          <input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label>
          Durée (années)
          <input type="number" value={years} onChange={(e) => setYears(e.target.value)} />
        </label>
        <label>
          Taux d'endettement max (%)
          <input type="number" step="1" value={maxRatio} onChange={(e) => setMaxRatio(e.target.value)} />
        </label>
        <label>
          Montant souhaité (€, optionnel)
          <input
            type="number"
            value={desired}
            placeholder="vide = montant max"
            onChange={(e) => setDesired(e.target.value)}
          />
        </label>
        <button type="submit">Calculer</button>
      </form>

      {result.match({
        NotAsked: () => null,
        Loading: () => <p className="muted">Calcul…</p>,
        Done: (r) =>
          r.match({
            Ok: (res) => <CapacitySummary res={res} />,
            Error: (message) => <p className="error">Erreur : {message}</p>,
          }),
      })}
    </section>
  );
};
