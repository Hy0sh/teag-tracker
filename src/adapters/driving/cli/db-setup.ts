import { makeDb } from "../../driven/db/database";
import { migrate } from "../../driven/db/migrate";

/** Creates the schema (idempotent). Data is loaded explicitly via the import commands. */
const run = async (): Promise<void> => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = makeDb(url);
  await migrate(db);
  await db.destroy();
  console.log("Schéma à jour (migration).");
};

run().catch((e) => {
  console.error("db-setup a échoué:", e);
  process.exitCode = 1;
});
