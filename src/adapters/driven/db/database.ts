import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { MarketRatesTable } from "./market-rates-table";
import type { LoansTable } from "./loans-table";
import type { TranchesTable } from "./tranches-table";
import type { ScheduleRowsTable } from "./schedule-rows-table";

// Columns are snake_case in Postgres but camelCase in code (CamelCasePlugin).
// Names mirror the domain types, so adapters map 1:1. All amounts are integer cents,
// all rates are integer basis points.

export type Database = {
  marketRates: MarketRatesTable;
  loans: LoansTable;
  tranches: TranchesTable;
  scheduleRows: ScheduleRowsTable;
};

export type Db = Kysely<Database>;

export const makeDb = (connectionString: string): Db =>
  new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString }) }),
    plugins: [new CamelCasePlugin()],
  });
