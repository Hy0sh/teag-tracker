import { describe, expect, it } from "vitest";
import { Future, Option, Result } from "@swan-io/boxed";
import { makeApplyEarlyRepayment } from "../../src/application/use-cases/apply-early-repayment";
import type { Loan } from "../../src/domain/model/loan";
import type { ScheduleRow } from "../../src/domain/services/schedule-row";
import type { LoanConfigPort } from "../../src/application/ports/loan-config.port";
import type { AmortizationSchedulePort } from "../../src/application/ports/amortization-schedule.port";
import type { ScheduleWriterPort } from "../../src/application/ports/schedule-writer.port";
import { toCents } from "../../src/domain/money";
import { percentToBp } from "../../src/domain/rate";

const loan: Loan = {
  tranches: [
    { type: "STANDARD", principal: toCents(160_000), nominalRateBp: percentToBp(3.5), termMonths: 240 },
  ],
  upfrontFees: 0,
  monthlyInsurance: 0,
};

const fakeLoan: LoanConfigPort = () => Future.value(Result.Ok(loan));
const noSchedule: AmortizationSchedulePort = () => Future.value(Result.Ok(Option.None()));
const lumpSum = toCents(20_000);

describe("apply-early-repayment use case", () => {
  it("persists the recomputed schedule and returns the result", async () => {
    let saved: ScheduleRow[] | undefined;
    const writer: ScheduleWriterPort = (rows) => {
      saved = rows;
      return Future.value(Result.Ok(undefined));
    };

    const apply = makeApplyEarlyRepayment({
      loanConfig: fakeLoan,
      scheduleProvider: noSchedule,
      scheduleWriter: writer,
    });
    const res = await apply({ currentMonth: 1, lumpSum, mode: "REDUCE_TERM" }).toPromise();

    res.match({
      Ok: (r) => {
        expect(r.newOutstanding).toBe(toCents(160_000) - lumpSum);
        expect(saved).toBeDefined();
        // the persisted schedule is the new (shorter) one
        expect(saved?.length).toBe(r.newTermMonths);
        const first = saved?.[0];
        expect(first).toBeDefined();
        // starting balance of the new schedule equals the reduced outstanding
        if (first) expect(first.outstandingPrincipal + first.principalPart).toBe(r.newOutstanding);
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("propagates a persistence error", async () => {
    const writer: ScheduleWriterPort = () =>
      Future.value(Result.Error({ _tag: "StoreError", message: "db down" }));
    const apply = makeApplyEarlyRepayment({
      loanConfig: fakeLoan,
      scheduleProvider: noSchedule,
      scheduleWriter: writer,
    });
    const res = await apply({ currentMonth: 1, lumpSum, mode: "REDUCE_TERM" }).toPromise();
    expect(res.isError()).toBe(true);
  });
});
