import { Future, Result } from "@swan-io/boxed";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { Loan } from "../../domain/model/loan";
import type { RenegotiationParams } from "../../domain/model/renegotiation-params";
import type { LoanConfigPort } from "../../application/ports/loan-config.port";
import { ConfigError } from "../../domain/errors/config-error";
import { toCents } from "../../domain/money";
import { percentToBp } from "../../domain/rate";

// In the config file: money fields are EUROS, rate fields are PERCENT (e.g. 3.5 = 3.5%).
// Converted to cents and basis points on load.
const schema = z.object({
  tranches: z
    .array(
      z.object({
        type: z.enum(["PTZ", "STANDARD"]),
        principal: z.number().nonnegative(),
        nominalRate: z.number().nonnegative(), // percent
        termMonths: z.number().int().positive(),
      }),
    )
    .min(1),
  upfrontFees: z.number().nonnegative().default(0),
  monthlyInsurance: z.number().nonnegative().default(0),
  renegotiation: z.object({
    currentMonth: z.number().int().positive(),
    scenario: z.enum(["EXTERNAL", "INTERNAL"]),
    fees: z.object({
      origination: z.number().nonnegative(),
      guarantee: z.number().nonnegative(),
      amendment: z.number().nonnegative(),
    }),
    threshold: z.object({
      minNetSavings: z.number().nonnegative(),
      minRateGap: z.number().nonnegative(), // percent points (0.5 = 0.5pt)
    }),
  }),
});

type Config = z.infer<typeof schema>;

const loadConfig = (path: string): Future<Result<Config, ConfigError>> =>
  Future.fromPromise(readFile(path, "utf8")).map((r) =>
    r.match({
      Ok: (txt) => {
        let raw: unknown;
        try {
          raw = JSON.parse(txt);
        } catch {
          return Result.Error(ConfigError(`invalid JSON in ${path}`));
        }
        const parsed = schema.safeParse(raw);
        return parsed.success
          ? Result.Ok(parsed.data)
          : Result.Error(ConfigError(`invalid config in ${path}: ${parsed.error.message}`));
      },
      Error: () => Result.Error(ConfigError(`cannot read config file ${path}`)),
    }),
  );

const toLoan = (cfg: Config): Loan => ({
  tranches: cfg.tranches.map((t) => ({
    type: t.type,
    principal: toCents(t.principal),
    nominalRateBp: percentToBp(t.nominalRate),
    termMonths: t.termMonths,
  })),
  upfrontFees: toCents(cfg.upfrontFees),
  monthlyInsurance: toCents(cfg.monthlyInsurance),
});

const toParams = (cfg: Config): RenegotiationParams => ({
  currentMonth: cfg.renegotiation.currentMonth,
  scenario: cfg.renegotiation.scenario,
  fees: {
    origination: toCents(cfg.renegotiation.fees.origination),
    guarantee: toCents(cfg.renegotiation.fees.guarantee),
    amendment: toCents(cfg.renegotiation.fees.amendment),
  },
  threshold: {
    minNetSavings: toCents(cfg.renegotiation.threshold.minNetSavings),
    minRateGapBp: percentToBp(cfg.renegotiation.threshold.minRateGap),
  },
});

export const makeLoanConfig =
  (path: string): LoanConfigPort =>
  () =>
    loadConfig(path).mapOk(toLoan);

export const loadRenegotiationParams = (
  path: string,
): Future<Result<RenegotiationParams, ConfigError>> => loadConfig(path).mapOk(toParams);
