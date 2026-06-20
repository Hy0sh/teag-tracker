import { describe, expect, it } from "vitest";
import { computeBorrowingCapacity } from "../../src/domain/services/borrowing-capacity";
import { monthlyPayment } from "../../src/domain/services/amortization";
import { toCents } from "../../src/domain/money";
import { percentToBp } from "../../src/domain/rate";

const baseInput = {
  monthlyIncome: toCents(4_000),
  existingMonthlyDebt: toCents(500),
  annualRateBp: percentToBp(3.5),
  termMonths: 240,
  maxDebtRatioBp: percentToBp(35),
};

describe("computeBorrowingCapacity", () => {
  it("derives the monthly capacity from income, debt and the 35% ratio", () => {
    const r = computeBorrowingCapacity(baseInput);
    // 4000 * 35% - 500 = 900 €
    expect(r.maxMonthlyPayment).toBe(toCents(900));
    // 500 / 4000 = 12.5%
    expect(r.currentDebtRatioBp).toBe(1250);
  });

  it("the borrowable amount's payment matches the available capacity (inverse consistency)", () => {
    const r = computeBorrowingCapacity(baseInput);
    expect(r.borrowableAmount).toBeGreaterThan(0);
    expect(monthlyPayment(r.borrowableAmount, percentToBp(3.5), 240)).toBeCloseTo(
      r.maxMonthlyPayment,
      -2, // within ~1 €
    );
  });

  it("evaluates a desired amount against the capacity", () => {
    const desiredAmount = toCents(100_000);
    const r = computeBorrowingCapacity({ ...baseInput, desiredAmount });
    const expectedPayment = monthlyPayment(desiredAmount, percentToBp(3.5), 240);
    expect(r.desiredMonthlyPayment).toBe(expectedPayment);
    expect(r.desiredFits).toBe(expectedPayment <= r.maxMonthlyPayment);
  });

  it("zero capacity when existing debt already exceeds the ratio", () => {
    const r = computeBorrowingCapacity({ ...baseInput, existingMonthlyDebt: toCents(2_000) });
    expect(r.maxMonthlyPayment).toBe(0);
    expect(r.borrowableAmount).toBe(0);
  });
});
