import { AsyncData, type Result } from "@swan-io/boxed";
import { type SyntheticEvent, useState } from "react";
import { simulate } from "../api-client";
import type { Scenario } from "../types/scenario";
import type { Verdict } from "../types/verdict";
import { VerdictSummary } from "./VerdictSummary";

export const SimulationForm = () => {
  const [ratePercent, setRatePercent] = useState("2.50");
  const [termMonths, setTermMonths] = useState("");
  const [scenario, setScenario] = useState<Scenario>("EXTERNAL");
  const [result, setResult] = useState<AsyncData<Result<Verdict, string>>>(AsyncData.NotAsked());

  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    setResult(AsyncData.Loading());
    const offeredRateBp = Math.round(Number.parseFloat(ratePercent) * 100);
    const term = termMonths.trim() === "" ? undefined : Number(termMonths);
    simulate({ scenario, offeredRateBp, ...(term ? { newTermMonths: term } : {}) }).onResolve((r) =>
      setResult(AsyncData.Done(r)),
    );
  };

  return (
    <section className="card">
      <h2>Simuler un scénario</h2>
      <form onSubmit={onSubmit} className="form">
        <label>
          Taux proposé (%)
          <input
            type="number"
            step="0.01"
            value={ratePercent}
            onChange={(e) => setRatePercent(e.target.value)}
          />
        </label>
        <label>
          Nouvelle durée (mois, optionnel)
          <input
            type="number"
            value={termMonths}
            placeholder="durée restante"
            onChange={(e) => setTermMonths(e.target.value)}
          />
        </label>
        <label>
          Scénario
          <select value={scenario} onChange={(e) => setScenario(e.target.value as Scenario)}>
            <option value="EXTERNAL">Rachat externe (avec IRA)</option>
            <option value="INTERNAL">Renégo interne (avenant)</option>
          </select>
        </label>
        <button type="submit">Simuler</button>
      </form>

      {result.match({
        NotAsked: () => null,
        Loading: () => <p className="muted">Calcul…</p>,
        Done: (r) =>
          r.match({
            Ok: (verdict) => <VerdictSummary verdict={verdict} />,
            Error: (message) => <p className="error">Erreur : {message}</p>,
          }),
      })}
    </section>
  );
};
