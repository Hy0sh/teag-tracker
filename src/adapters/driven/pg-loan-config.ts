import { Future, Result } from "@swan-io/boxed";
import type { Db } from "./db/database";
import type { Loan } from "../../domain/model/loan";
import type { RenegotiationParams } from "../../domain/model/renegotiation-params";
import type { LoanConfigPort } from "../../application/ports/loan-config.port";
import { ConfigError } from "../../domain/errors/config-error";

const firstLoan = (db: Db) =>
  db.selectFrom("loans").selectAll().orderBy("id").limit(1).executeTakeFirst();

export const makePgLoanConfig =
  (db: Db): LoanConfigPort =>
  () =>
    Future.fromPromise(
      (async () => {
        const loan = await firstLoan(db);
        if (!loan) return null;
        // Selected columns match LoanTranche exactly -> no mapping.
        const tranches = await db
          .selectFrom("tranches")
          .select(["type", "principal", "nominalRateBp", "termMonths"])
          .where("loanId", "=", loan.id)
          .orderBy("position")
          .execute();
        return { loan, tranches };
      })(),
    ).map((r) =>
      r.match({
        Ok: (data) =>
          data
            ? Result.Ok<Loan, ConfigError>({
                tranches: data.tranches,
                upfrontFees: data.loan.upfrontFees,
                monthlyInsurance: data.loan.monthlyInsurance,
              })
            : Result.Error(ConfigError("no loan configured in database")),
        Error: (e) => Result.Error(ConfigError(`load loan failed: ${String(e)}`)),
      }),
    );

export const loadPgRenegotiationParams = (
  db: Db,
): Future<Result<RenegotiationParams, ConfigError>> =>
  Future.fromPromise(firstLoan(db)).map((r) =>
    r.match({
      Ok: (loan) =>
        loan
          ? Result.Ok<RenegotiationParams, ConfigError>({
              currentMonth: loan.currentMonth,
              scenario: loan.scenario,
              fees: {
                origination: loan.feeOrigination,
                guarantee: loan.feeGuarantee,
                amendment: loan.feeAmendment,
              },
              threshold: {
                minNetSavings: loan.minNetSavings,
                minRateGapBp: loan.minRateGapBp,
              },
            })
          : Result.Error(ConfigError("no loan configured in database")),
      Error: (e) => Result.Error(ConfigError(`load params failed: ${String(e)}`)),
    }),
  );
