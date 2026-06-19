import { describe, expect, it } from "vitest";
import { Future, Result } from "@swan-io/boxed";
import { makeComputeInitialApr } from "../../src/application/use-cases/compute-initial-apr";
import type { Loan } from "../../src/domain/model/loan";
import type { LoanConfigPort } from "../../src/application/ports/loan-config.port";
import { toCents } from "../../src/domain/money";
import { percentToBp } from "../../src/domain/rate";

const fakeLoanConfig =
  (loan: Loan): LoanConfigPort =>
  () =>
    Future.value(Result.Ok(loan));

describe("compute-initial-apr use case", () => {
  it("returns the actuarial APR of a single-tranche loan with no fees nor insurance", async () => {
    const loan: Loan = {
      tranches: [
        { type: "STANDARD", principal: toCents(100_000), nominalRateBp: percentToBp(3), termMonths: 240 },
      ],
      upfrontFees: 0,
      monthlyInsurance: 0,
    };

    const result = await makeComputeInitialApr({ loanConfig: fakeLoanConfig(loan) })().toPromise();

    result.match({
      // (1 + 0.03/12)^12 - 1 = 3.0416% -> 304 bp
      Ok: ({ aprBp }) => expect(aprBp).toBe(304),
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("for PTZ 0% + standard, the APR is strictly between 0 and the standard tranche rate", async () => {
    const loan: Loan = {
      tranches: [
        { type: "PTZ", principal: toCents(40_000), nominalRateBp: 0, termMonths: 240 },
        { type: "STANDARD", principal: toCents(160_000), nominalRateBp: percentToBp(3.5), termMonths: 240 },
      ],
      upfrontFees: 0,
      monthlyInsurance: 0,
    };

    const result = await makeComputeInitialApr({ loanConfig: fakeLoanConfig(loan) })().toPromise();

    result.match({
      Ok: ({ aprBp }) => {
        expect(aprBp).toBeGreaterThan(0);
        const standardAprBp = Math.round(((1 + 0.035 / 12) ** 12 - 1) * 10_000);
        expect(aprBp).toBeLessThan(standardAprBp);
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("fees and insurance raise the APR compared to the nominal alone", async () => {
    const base = {
      tranches: [
        { type: "STANDARD" as const, principal: toCents(100_000), nominalRateBp: percentToBp(3), termMonths: 240 },
      ],
    };
    const withoutFees: Loan = { ...base, upfrontFees: 0, monthlyInsurance: 0 };
    const withFees: Loan = { ...base, upfrontFees: toCents(3_000), monthlyInsurance: toCents(30) };

    const a = (await makeComputeInitialApr({ loanConfig: fakeLoanConfig(withoutFees) })().toPromise()).getOr({ aprBp: 0 }).aprBp;
    const b = (await makeComputeInitialApr({ loanConfig: fakeLoanConfig(withFees) })().toPromise()).getOr({ aprBp: 0 }).aprBp;
    expect(b).toBeGreaterThan(a);
  });
});
