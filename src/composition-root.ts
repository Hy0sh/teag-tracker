import { type Db, makeDb } from "./adapters/driven/db/database";
import { makeBdfSource } from "./adapters/driven/bdf-webstat.source";
import { makePgRateRepository } from "./adapters/driven/pg-rate.repository";
import { loadPgRenegotiationParams, makePgLoanConfig } from "./adapters/driven/pg-loan-config";
import { makePgScheduleProvider } from "./adapters/driven/pg-amortization-schedule";
import { makeCollectRates } from "./application/use-cases/collect-rates";
import { makeComputeInitialApr } from "./application/use-cases/compute-initial-apr";
import { makeEvaluateRenegotiation } from "./application/use-cases/evaluate-renegotiation";
import { makeSimulateScenario } from "./application/use-cases/simulate-scenario";
import { makeGetRateHistory } from "./application/use-cases/get-rate-history";
import { makeGetSchedule } from "./application/use-cases/get-schedule";
import { makeSimulateEarlyRepayment } from "./application/use-cases/simulate-early-repayment";
import { makeApplyEarlyRepayment } from "./application/use-cases/apply-early-repayment";
import { makePgScheduleWriter } from "./adapters/driven/pg-schedule-writer";

const defaultDb = (): Db => makeDb(process.env.DATABASE_URL ?? "");

/** Composition root: instantiates the Postgres-backed driven adapters and injects them into the use cases. */
export const buildApp = (db: Db = defaultDb()) => {
  const loanConfig = makePgLoanConfig(db);
  const repository = makePgRateRepository(db);
  const scheduleProvider = makePgScheduleProvider(db);
  const scheduleWriter = makePgScheduleWriter(db);

  // Default source: ECB Data Portal — French housing-loan rate (MIR), public SDMX-JSON, no API key.
  const ECB_FR_HOUSING_RATE =
    "https://data-api.ecb.europa.eu/service/data/MIR/M.FR.B.A2C.A.R.A.2250.EUR.N?format=jsondata";
  const source = makeBdfSource({
    // `||` (not `??`) so an empty env string (Docker default) falls back to the ECB URL.
    url: process.env.RATE_SOURCE_URL || ECB_FR_HOUSING_RATE,
    apiKey: process.env.RATE_SOURCE_KEY || undefined,
  });

  return {
    db,
    collectRates: makeCollectRates({ source, repository }),
    computeInitialApr: makeComputeInitialApr({ loanConfig }),
    evaluateRenegotiation: makeEvaluateRenegotiation({
      loanConfig,
      rateRepository: repository,
      scheduleProvider,
    }),
    simulateScenario: makeSimulateScenario({ loanConfig, scheduleProvider }),
    simulateEarlyRepayment: makeSimulateEarlyRepayment({ loanConfig, scheduleProvider }),
    applyEarlyRepayment: makeApplyEarlyRepayment({ loanConfig, scheduleProvider, scheduleWriter }),
    getRateHistory: makeGetRateHistory({ repository }),
    getSchedule: makeGetSchedule({ loanConfig, scheduleProvider }),
    loadRenegotiationParams: () => loadPgRenegotiationParams(db),
  };
};

export type App = ReturnType<typeof buildApp>;
