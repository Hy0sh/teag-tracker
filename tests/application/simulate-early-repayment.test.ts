import { describe, expect, it } from "vitest";
import { Future, Option, Result } from "@swan-io/boxed";
import { makeSimulateEarlyRepayment } from "../../src/application/use-cases/simulate-early-repayment";
import type { Loan } from "../../src/domain/model/loan";
import type { LoanConfigPort } from "../../src/application/ports/loan-config.port";
import type { AmortizationSchedulePort } from "../../src/application/ports/amortization-schedule.port";
import { toCents } from "../../src/domain/money";
import { percentToBp } from "../../src/domain/rate";
import { earlyRepaymentFee } from "../../src/domain/services/renegotiation";
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
const lumpSum = toCents(20_000);

describe("simulate-early-repayment use case", () => {
  it("REDUCE_PAYMENT keeps the term and lowers the monthly payment", async () => {
    const simulate = makeSimulateEarlyRepayment({ loanConfig: fakeLoan, scheduleProvider: noSchedule });
    const res = await simulate({ currentMonth: 1, lumpSum, mode: "REDUCE_PAYMENT" }).toPromise();

    res.match({
      Ok: (r) => {
        const principal = toCents(160_000);
        const rate = percentToBp(3.5);
        expect(r.newOutstanding).toBe(principal - lumpSum);
        expect(r.ira).toBe(earlyRepaymentFee(lumpSum, rate));
        expect(r.newTermMonths).toBe(240); // unchanged
        expect(r.newMonthlyPayment).toBe(monthlyPayment(principal - lumpSum, rate, 240));
        expect(r.interestSaved).toBeGreaterThan(0);
        expect(r.netSaving).toBe(r.interestSaved - r.ira);
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("REDUCE_TERM keeps the payment and shortens the term", async () => {
    const simulate = makeSimulateEarlyRepayment({ loanConfig: fakeLoan, scheduleProvider: noSchedule });
    const res = await simulate({ currentMonth: 1, lumpSum, mode: "REDUCE_TERM" }).toPromise();

    res.match({
      Ok: (r) => {
        const principal = toCents(160_000);
        const rate = percentToBp(3.5);
        expect(r.newMonthlyPayment).toBe(monthlyPayment(principal, rate, 240)); // payment kept
        expect(r.newTermMonths).toBeLessThan(240);
        expect(r.monthsSaved).toBe(240 - r.newTermMonths);
        expect(r.interestSaved).toBeGreaterThan(0);
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });
});
