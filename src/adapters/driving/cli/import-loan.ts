import { makeDb } from "../../driven/db/database";
import { importLoan } from "../../driven/db/import";
import { loadRenegotiationParams, makeLoanConfig } from "../../driven/json-loan-config";

const path = process.argv[2] ?? "data/loan.json";

const run = async (): Promise<void> => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = makeDb(url);

  const loanRes = await makeLoanConfig(path)().toPromise();
  const paramsRes = await loadRenegotiationParams(path).toPromise();

  const loan = loanRes.match({ Ok: (v) => v, Error: () => undefined });
  const params = paramsRes.match({ Ok: (v) => v, Error: () => undefined });
  if (!loan || !params) {
    console.error(`Import prêt échoué : impossible de lire ${path}.`);
    process.exitCode = 1;
    await db.destroy();
    return;
  }

  await importLoan(db, loan, params);
  console.log(`Prêt importé depuis ${path} (${loan.tranches.length} tranches).`);
  await db.destroy();
};

run().catch((e) => {
  console.error("import-loan a échoué:", e);
  process.exitCode = 1;
});
