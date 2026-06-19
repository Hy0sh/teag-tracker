import type { Db } from "./database";

/** Creates the schema if it does not exist (idempotent). CamelCasePlugin maps the names to snake_case. */
export const migrate = async (db: Db): Promise<void> => {
  await db.schema
    .createTable("marketRates")
    .ifNotExists()
    .addColumn("date", "text", (c) => c.primaryKey())
    .addColumn("rateBp", "integer", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("loans")
    .ifNotExists()
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("upfrontFees", "integer", (c) => c.notNull())
    .addColumn("monthlyInsurance", "integer", (c) => c.notNull())
    .addColumn("currentMonth", "integer", (c) => c.notNull())
    .addColumn("scenario", "text", (c) => c.notNull())
    .addColumn("feeOrigination", "integer", (c) => c.notNull())
    .addColumn("feeGuarantee", "integer", (c) => c.notNull())
    .addColumn("feeAmendment", "integer", (c) => c.notNull())
    .addColumn("minNetSavings", "integer", (c) => c.notNull())
    .addColumn("minRateGapBp", "integer", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("tranches")
    .ifNotExists()
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("loanId", "integer", (c) => c.notNull().references("loans.id").onDelete("cascade"))
    .addColumn("position", "integer", (c) => c.notNull())
    .addColumn("type", "text", (c) => c.notNull())
    .addColumn("principal", "integer", (c) => c.notNull())
    .addColumn("nominalRateBp", "integer", (c) => c.notNull())
    .addColumn("termMonths", "integer", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("scheduleRows")
    .ifNotExists()
    .addColumn("month", "integer", (c) => c.primaryKey())
    .addColumn("payment", "integer", (c) => c.notNull())
    .addColumn("principalPart", "integer", (c) => c.notNull())
    .addColumn("interestPart", "integer", (c) => c.notNull())
    .addColumn("outstandingPrincipal", "integer", (c) => c.notNull())
    .execute();
};
