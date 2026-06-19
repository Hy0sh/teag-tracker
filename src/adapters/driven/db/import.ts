import type { Db } from "./database";
import type { Loan } from "../../../domain/model/loan";
import type { RenegotiationParams } from "../../../domain/model/renegotiation-params";
import type { ScheduleRow } from "../../../domain/services/schedule-row";

/** Replaces the loan, its tranches and renegotiation params (single-loan model). Idempotent. */
export const importLoan = (db: Db, loan: Loan, params: RenegotiationParams): Promise<void> =>
  db.transaction().execute(async (trx) => {
    await trx.deleteFrom("loans").execute(); // cascades to tranches
    const { id } = await trx
      .insertInto("loans")
      .values({
        upfrontFees: loan.upfrontFees,
        monthlyInsurance: loan.monthlyInsurance,
        currentMonth: params.currentMonth,
        scenario: params.scenario,
        feeOrigination: params.fees.origination,
        feeGuarantee: params.fees.guarantee,
        feeAmendment: params.fees.amendment,
        minNetSavings: params.threshold.minNetSavings,
        minRateGapBp: params.threshold.minRateGapBp,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    await trx
      .insertInto("tranches")
      .values(loan.tranches.map((tranche, position) => ({ loanId: id, position, ...tranche })))
      .execute();
  });

/** Replaces the whole amortization schedule. Idempotent. */
export const importSchedule = (db: Db, rows: ScheduleRow[]): Promise<void> =>
  db.transaction().execute(async (trx) => {
    await trx.deleteFrom("scheduleRows").execute();
    if (rows.length > 0) {
      await trx.insertInto("scheduleRows").values(rows).execute();
    }
  });
