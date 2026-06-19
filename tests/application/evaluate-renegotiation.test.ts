import { describe, expect, it } from "vitest";
import { Future, Option, Result } from "@swan-io/boxed";
import { makeEvaluateRenegotiation } from "../../src/application/use-cases/evaluate-renegotiation";
import type { Loan } from "../../src/domain/model/loan";
import type { RateHistory } from "../../src/domain/model/rate-history";
import type { AmortizationSchedule } from "../../src/domain/services/amortization-schedule";
import type { LoanConfigPort } from "../../src/application/ports/loan-config.port";
import type { RateRepositoryPort } from "../../src/application/ports/rate-repository.port";
import type { AmortizationSchedulePort } from "../../src/application/ports/amortization-schedule.port";
import { toCents } from "../../src/domain/money";
import { percentToBp } from "../../src/domain/rate";

const ptzPlusStandard: Loan = {
  tranches: [
    { type: "PTZ", principal: toCents(40_000), nominalRateBp: 0, termMonths: 240 },
    { type: "STANDARD", principal: toCents(160_000), nominalRateBp: percentToBp(3.5), termMonths: 240 },
  ],
  upfrontFees: 0,
  monthlyInsurance: 0,
};

const fakeLoan = (loan: Loan): LoanConfigPort => () => Future.value(Result.Ok(loan));
const fakeRates = (history: RateHistory): RateRepositoryPort => ({
  loadHistory: () => Future.value(Result.Ok(history)),
  save: () => Future.value(Result.Ok(history)),
});
const fakeSchedule = (s: Option<AmortizationSchedule>): AmortizationSchedulePort => () =>
  Future.value(Result.Ok(s));

const fees = { origination: toCents(1_000), guarantee: toCents(2_000), amendment: toCents(500) };
const threshold = { minNetSavings: toCents(1_000), minRateGapBp: percentToBp(0.5) };
const history: RateHistory = [
  { date: "2026-01", rateBp: percentToBp(3) },
  { date: "2026-06", rateBp: percentToBp(2) },
];

describe("evaluate-renegotiation use case", () => {
  it("recommends renegotiating when the rate gap and net savings are significant (degraded mode)", async () => {
    const evaluate = makeEvaluateRenegotiation({
      loanConfig: fakeLoan(ptzPlusStandard),
      rateRepository: fakeRates(history),
      scheduleProvider: fakeSchedule(Option.None()),
    });

    const res = await evaluate({ currentMonth: 1, scenario: "EXTERNAL", fees, threshold }).toPromise();

    res.match({
      Ok: (v) => {
        expect(v.decision).toBe("RENEGOTIATE");
        // compared rate = the STANDARD tranche (3.5% = 350 bp), PTZ ignored
        expect(v.currentRateBp).toBe(350);
        expect(v.offeredRateBp).toBe(200); // most recent observation
        expect(v.netSavings).toBeGreaterThan(0);
        expect(v.earlyRepaymentFee).toBeGreaterThan(0); // external scenario -> ERF applied
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("recommends waiting when the rate gap is below the margin", async () => {
    const evaluate = makeEvaluateRenegotiation({
      loanConfig: fakeLoan(ptzPlusStandard),
      rateRepository: fakeRates([{ date: "2026-06", rateBp: percentToBp(3.4) }]),
      scheduleProvider: fakeSchedule(Option.None()),
    });

    const res = await evaluate({ currentMonth: 1, scenario: "EXTERNAL", fees, threshold }).toPromise();
    res.match({
      Ok: (v) => expect(v.decision).toBe("WAIT"),
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("uses the EXACT interest from the real schedule when provided", async () => {
    // minimal real schedule: 2 installments, exact remaining interest = 700 cents
    const schedule: AmortizationSchedule = {
      rows: [
        { month: 1, payment: 1_000, principalPart: 600, interestPart: 400, outstandingPrincipal: 99_400 },
        { month: 2, payment: 1_000, principalPart: 700, interestPart: 300, outstandingPrincipal: 98_700 },
      ],
    };
    const evaluate = makeEvaluateRenegotiation({
      loanConfig: fakeLoan(ptzPlusStandard),
      rateRepository: fakeRates(history),
      scheduleProvider: fakeSchedule(Option.Some(schedule)),
    });

    const res = await evaluate({ currentMonth: 1, scenario: "EXTERNAL", fees, threshold }).toPromise();

    res.match({
      Ok: (v) => {
        expect(v.currentRemainingInterest).toBeCloseTo(700, 6); // 400 + 300 read from the schedule
        expect(v.remainingMonths).toBe(2);
        expect(v.outstandingPrincipal).toBeCloseTo(100_000, 6); // outstanding(99400) + principalPart(600) of month 1
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("fails cleanly when the rate history is empty", async () => {
    const evaluate = makeEvaluateRenegotiation({
      loanConfig: fakeLoan(ptzPlusStandard),
      rateRepository: fakeRates([]),
      scheduleProvider: fakeSchedule(Option.None()),
    });

    const res = await evaluate({ currentMonth: 1, scenario: "EXTERNAL", fees, threshold }).toPromise();
    expect(res.isError()).toBe(true);
  });
});
