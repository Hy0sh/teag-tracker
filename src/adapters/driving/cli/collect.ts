import { buildApp } from "../../../composition-root";

const app = buildApp();

app.collectRates().onResolve((result) => {
  result.match({
    Ok: (history) => console.log(`Collecte OK — ${history.length} observations dans l'historique.`),
    Error: (e) => {
      console.error(`Échec de la collecte : ${e.message}`);
      process.exitCode = 1;
    },
  });
  void app.db.destroy();
});
