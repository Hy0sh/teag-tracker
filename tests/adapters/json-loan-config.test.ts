import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeLoanConfig, loadRenegotiationParams } from "../../src/adapters/driven/json-loan-config";

let dir: string;
const configFile = () => join(dir, "loan.json");

const sampleConfig = {
  tranches: [
    { type: "PTZ", principal: 40000, nominalRate: 0, termMonths: 240 },
    { type: "STANDARD", principal: 160000, nominalRate: 3.5, termMonths: 240 }, // percent
  ],
  upfrontFees: 3000,
  monthlyInsurance: 30,
  renegotiation: {
    currentMonth: 12,
    scenario: "EXTERNAL",
    fees: { origination: 1000, guarantee: 2000, amendment: 500 },
    threshold: { minNetSavings: 1000, minRateGap: 0.5 }, // 0.5 point
  },
};

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "teg-loan-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("json-loan-config adapter", () => {
  it("loads the loan and converts euro amounts to cents", async () => {
    await writeFile(configFile(), JSON.stringify(sampleConfig));

    const res = await makeLoanConfig(configFile())().toPromise();

    res.match({
      Ok: (loan) => {
        expect(loan.tranches[0]?.principal).toBe(4_000_000); // 40 000 € -> cents
        expect(loan.tranches[1]?.principal).toBe(16_000_000);
        expect(loan.tranches[1]?.nominalRateBp).toBe(350); // 3.5% -> 350 bp
        expect(loan.upfrontFees).toBe(300_000);
        expect(loan.monthlyInsurance).toBe(3_000);
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("loads renegotiation params with money in cents and rate as decimal", async () => {
    await writeFile(configFile(), JSON.stringify(sampleConfig));

    const res = await loadRenegotiationParams(configFile()).toPromise();

    res.match({
      Ok: (params) => {
        expect(params.currentMonth).toBe(12);
        expect(params.scenario).toBe("EXTERNAL");
        expect(params.fees.origination).toBe(100_000);
        expect(params.threshold.minNetSavings).toBe(100_000);
        expect(params.threshold.minRateGapBp).toBe(50); // 0.5 point -> 50 bp
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("fails with a ConfigError when the file is missing", async () => {
    const res = await makeLoanConfig(join(dir, "nope.json"))().toPromise();
    expect(res.isError()).toBe(true);
  });
});
