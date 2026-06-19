import { buildApp } from "../../../composition-root";
import { formatEuros } from "../../../domain/money";
import { formatRate } from "../../../domain/rate";

const app = buildApp();

app
  .loadRenegotiationParams()
  .flatMapOk((params) =>
    app.computeInitialApr().flatMapOk((teg) =>
      app
        .evaluateRenegotiation({
          currentMonth: params.currentMonth,
          scenario: params.scenario,
          fees: params.fees,
          threshold: params.threshold,
        })
        .mapOk((verdict) => ({ teg, verdict })),
    ),
  )
  .onResolve((result) => {
    result.match({
      Ok: ({ teg, verdict }) => {
        console.log(`TEG de départ (TAEG, assurance incluse) : ${formatRate(teg.aprBp)}`);
        console.log("");
        console.log(`Tranche classique — taux actuel : ${formatRate(verdict.currentRateBp)}`);
        console.log(
          `Taux marché : ${formatRate(verdict.offeredRateBp)} (écart ${formatRate(verdict.rateGapBp)})`,
        );
        console.log(
          `Capital restant dû : ${formatEuros(verdict.outstandingPrincipal)} sur ${verdict.remainingMonths} mois`,
        );
        console.log(`Intérêts restants — actuel : ${formatEuros(verdict.currentRemainingInterest)}`);
        console.log(`Intérêts restants — nouvelle offre : ${formatEuros(verdict.newRemainingInterest)}`);
        console.log(
          `Frais (dont IRA ${formatEuros(verdict.earlyRepaymentFee)}) : ${formatEuros(verdict.totalFees)}`,
        );
        console.log(`Économie nette : ${formatEuros(verdict.netSavings)}`);
        console.log("");
        console.log(`>>> ${verdict.decision === "RENEGOTIATE" ? "RENÉGOCIER" : "ATTENDRE"}`);
      },
      Error: (e) => {
        console.error(`Erreur : ${e.message}`);
        process.exitCode = 1;
      },
    });
    void app.db.destroy();
  });
