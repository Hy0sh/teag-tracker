import { describe, expect, it } from "vitest";
import { parseScheduleCsv } from "../../src/adapters/driven/csv-amortization-schedule";

describe("parseScheduleCsv", () => {
  it("parses euro CSV rows into cent-based schedule rows", () => {
    const csv = [
      "month,payment,principal,interest,outstanding",
      "1,1000.00,600.00,400.00,99400.00",
      "2,1000.00,700.00,300.00,98700.00",
    ].join("\n");

    const res = parseScheduleCsv(csv);

    res.match({
      Ok: (schedule) => {
        expect(schedule.rows).toHaveLength(2);
        expect(schedule.rows[0]).toEqual({
          month: 1,
          payment: 100_000,
          principalPart: 60_000,
          interestPart: 40_000,
          outstandingPrincipal: 9_940_000,
        });
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("rejects a malformed row", () => {
    expect(parseScheduleCsv("month,payment\n1,oops").isError()).toBe(true);
  });
});
