import { useState } from "react";
import { fetchRates, fetchSchedule, fetchVerdict } from "./api-client";
import { useFuture } from "./use-future";
import { pct } from "./format";
import { RateChart } from "./components/RateChart";
import { ScheduleChart } from "./components/ScheduleChart";
import { VerdictSummary } from "./components/VerdictSummary";
import { SimulationForm } from "./components/SimulationForm";
import { EarlyRepaymentForm } from "./components/EarlyRepaymentForm";

type Tab = "overview" | "schedule" | "renegotiate" | "repay";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Synthèse" },
  { id: "schedule", label: "Mensualités" },
  { id: "renegotiate", label: "Renégociation" },
  { id: "repay", label: "Remboursement anticipé" },
];

export const App = () => {
  const [tab, setTab] = useState<Tab>("overview");
  const rates = useFuture(fetchRates, []);
  const verdict = useFuture(fetchVerdict, []);
  const schedule = useFuture(fetchSchedule, []);

  return (
    <main className="container">
      <header>
        <h1>TEG Tracker</h1>
        <p className="muted">Suivi des taux & aide à la renégociation (PTZ + classique)</p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? "tab tab-active" : "tab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <>
          <section className="card">
            <h2>Verdict actuel</h2>
            {verdict.match({
              NotAsked: () => null,
              Loading: () => <p className="muted">Chargement…</p>,
              Done: (r) =>
                r.match({
                  Ok: ({ aprBp, verdict: v }) => (
                    <>
                      <p>
                        TEG de départ (TAEG, assurance incluse) : <strong>{pct(aprBp)}</strong>
                      </p>
                      <VerdictSummary verdict={v} />
                    </>
                  ),
                  Error: (message) => <p className="error">Erreur : {message}</p>,
                }),
            })}
          </section>

          <section className="card">
            <h2>Taux de marché</h2>
            {rates.match({
              NotAsked: () => null,
              Loading: () => <p className="muted">Chargement…</p>,
              Done: (r) =>
                r.match({
                  Ok: (data) => <RateChart rates={data} />,
                  Error: (message) => <p className="error">Erreur : {message}</p>,
                }),
            })}
          </section>
        </>
      )}

      {tab === "schedule" && (
        <section className="card">
          <h2>Mes mensualités</h2>
          {schedule.match({
            NotAsked: () => null,
            Loading: () => <p className="muted">Chargement…</p>,
            Done: (r) =>
              r.match({
                Ok: (rows) => <ScheduleChart rows={rows} />,
                Error: (message) => <p className="error">Erreur : {message}</p>,
              }),
          })}
        </section>
      )}

      {tab === "renegotiate" && <SimulationForm />}

      {tab === "repay" && <EarlyRepaymentForm />}
    </main>
  );
};
