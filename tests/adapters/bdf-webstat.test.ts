import { describe, expect, it } from "vitest";
import { parseSdmxJson } from "../../src/adapters/driven/bdf-webstat.source";

// Minimal SDMX-JSON 2.0 shape returned by the Banque de France Webstat API.
const fixture = {
  data: {
    structure: {
      dimensions: {
        observation: [
          {
            id: "TIME_PERIOD",
            values: [{ id: "2026-04" }, { id: "2026-05" }, { id: "2026-06" }],
          },
        ],
      },
    },
    dataSets: [
      {
        series: {
          "0:0:0": {
            observations: {
              "0": [3.12],
              "1": [3.1],
              "2": [3.08],
            },
          },
        },
      },
    ],
  },
};

describe("parseSdmxJson (BdF Webstat)", () => {
  it("maps observations to monthly rates as decimals", () => {
    const result = parseSdmxJson(fixture);

    result.match({
      Ok: (rates) => {
        expect(rates).toEqual([
          { date: "2026-04", rateBp: 312 },
          { date: "2026-05", rateBp: 310 },
          { date: "2026-06", rateBp: 308 },
        ]);
      },
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("parses the ECB shape where structure/dataSets are at the top level (no `data` wrapper)", () => {
    const ecbShape = {
      structure: {
        dimensions: {
          observation: [{ id: "TIME_PERIOD", values: [{ id: "2026-01" }, { id: "2026-02" }] }],
        },
      },
      dataSets: [{ series: { "0:0:0": { observations: { "0": [3.05, 0], "1": [3.1, 0] } } } }],
    };

    parseSdmxJson(ecbShape).match({
      Ok: (rates) =>
        expect(rates).toEqual([
          { date: "2026-01", rateBp: 305 },
          { date: "2026-02", rateBp: 310 },
        ]),
      Error: (e) => expect.unreachable(`expected Ok, got Error: ${JSON.stringify(e)}`),
    });
  });

  it("returns a FetchError on an unexpected payload", () => {
    expect(parseSdmxJson({ nope: true }).isError()).toBe(true);
  });
});
