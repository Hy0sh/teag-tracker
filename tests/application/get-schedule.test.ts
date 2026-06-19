import { describe, expect, it } from "vitest";
import { Future, Option, Result } from "@swan-io/boxed";
import { makeGetSchedule } from "../../src/application/use-cases/get-schedule";
import type { Loan } from "../../src/domain/model/loan";
import type { AmortizationSchedule } from "../../src/domain/services/amortization-schedule";
import type { LoanConfigPort } from "../../src/application/ports/loan-config.port";
import type { AmortizationSchedulePort } from "../../src/application/ports/amortization-schedule.port";
import { toCents } from "../../src/domain/money";
import { percentToBp } from "../../src/domain/rate";

const loan: Loan = {
  tranches: [
    { type: "PTZ", principal: toCents(40_000), nominalRateBp: 0, termMonths: 240 },
    { type: "STANDARD", principal: toCents(160_000), nominalRateBp: percentToBp(3.5), termMonths: 12 },
  ],
  upfrontFees: 0,
  monthlyInsurance: 0,
};

const fakeLoan: LoanConfigPort = () => Future.value(Result.Ok(loan));

describe("get-schedule use case", () => {
  it("returns the rows of the real schedule when provided", async () => {
    const schedule: AmortizationSchedule = {
      rows: [
        { month: 1, payment: 100_000, principalPart: 60_000, interestPart: 40_000, outstandingPrincipal: 99_400 },
        { month: 2, payment: 93_527, principalPart: 70_000, interestPart: 23_527, outstandingPrincipal: 98_700 },
      ],
    };
    const provider: AmortizationSchedulePort = () => Future.value(Result.Ok(Option.Some(schedule)));

    const res = await makeGetSchedule({ loanConfig: fakeLoan, scheduleProvider: provider })().toPromise();

    res.match({
      Ok: (rows) => {
        expect(rows).toHaveLength(2);
        expect(rows[0]?.payment).toBe(100_000);
        expect(rows[1]?.payment).toBe(93_527);
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("generates the standard tranche schedule when no real schedule is provided", async () => {
    const provider: AmortizationSchedulePort = () => Future.value(Result.Ok(Option.None()));

    const res = await makeGetSchedule({ loanConfig: fakeLoan, scheduleProvider: provider })().toPromise();

    res.match({
      Ok: (rows) => expect(rows).toHaveLength(12), // standard tranche termMonths
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });
});
