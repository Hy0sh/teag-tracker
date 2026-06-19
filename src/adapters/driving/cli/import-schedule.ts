import { readFile } from "node:fs/promises";
import { makeDb } from "../../driven/db/database";
import { importSchedule } from "../../driven/db/import";
import { parseScheduleCsv } from "../../driven/csv-amortization-schedule";

const path = process.argv[2] ?? "data/tableau.csv";

const run = async (): Promise<void> => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = makeDb(url);

  const text = await readFile(path, "utf8").catch(() => null);
  if (text === null) {
    console.error(`Import échéancier échoué : fichier introuvable ${path}.`);
    process.exitCode = 1;
    await db.destroy();
    return;
  }

  await parseScheduleCsv(text).match({
    Ok: async (schedule) => {
      await importSchedule(db, schedule.rows);
      console.log(`Échéancier importé depuis ${path} (${schedule.rows.length} lignes).`);
    },
    Error: async (e) => {
      console.error(`CSV invalide : ${e.message}`);
      process.exitCode = 1;
    },
  });

  await db.destroy();
};

run().catch((e) => {
  console.error("import-schedule a échoué:", e);
  process.exitCode = 1;
});
