import { describe, expect, it } from "vitest";
import { Future, Option, Result } from "@swan-io/boxed";
import { makeSimulateScenario } from "../../src/application/use-cases/simulate-scenario";
import type { Loan } from "../../src/domain/model/loan";
import type { LoanConfigPort } from "../../src/application/ports/loan-config.port";
import type { AmortizationSchedulePort } from "../../src/application/ports/amortization-schedule.port";
import { toCents } from "../../src/domain/money";
import { percentToBp } from "../../src/domain/rate";
import { monthlyPayment } from "../../src/domain/services/amortization";

const loan: Loan = {
  tranches: [
    { type: "PTZ", principal: toCents(40_000), nominalRateBp: 0, termMonths: 240 },
    { type: "STANDARD", principal: toCents(160_000), nominalRateBp: percentToBp(3.5), termMonths: 240 },
  ],
  upfrontFees: 0,
  monthlyInsurance: 0,
};

const fakeLoan: LoanConfigPort = () => Future.value(Result.Ok(loan));
const noSchedule: AmortizationSchedulePort = () => Future.value(Result.Ok(Option.None()));
const fees = { origination: toCents(1_000), guarantee: toCents(2_000), amendment: toCents(500) };
const threshold = { minNetSavings: toCents(1_000), minRateGapBp: percentToBp(0.5) };

describe("simulate-scenario use case", () => {
  it("applies an overridden term and offered rate to the standard tranche", async () => {
    const simulate = makeSimulateScenario({ loanConfig: fakeLoan, scheduleProvider: noSchedule });
    const res = await simulate({
      currentMonth: 1,
      scenario: "EXTERNAL",
      offeredRateBp: percentToBp(2),
      fees,
      threshold,
      newTermMonths: 180,
    }).toPromise();

    res.match({
      Ok: (v) => {
        expect(v.remainingMonths).toBe(180);
        expect(v.offeredRateBp).toBe(200);
        expect(v.earlyRepaymentFee).toBeGreaterThan(0);
        // mensualité de la nouvelle offre, au taux simulé sur la durée simulée
        expect(v.newMonthlyPayment).toBe(monthlyPayment(v.outstandingPrincipal, 200, 180));
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("internal scenario applies the amendment fee and no early repayment fee", async () => {
    const simulate = makeSimulateScenario({ loanConfig: fakeLoan, scheduleProvider: noSchedule });
    const res = await simulate({
      currentMonth: 1,
      scenario: "INTERNAL",
      offeredRateBp: percentToBp(2),
      fees,
      threshold,
    }).toPromise();

    res.match({
      Ok: (v) => {
        expect(v.earlyRepaymentFee).toBe(0);
        expect(v.totalFees).toBe(fees.amendment);
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });
});
