import { Future, Result } from "@swan-io/boxed";
import type { RateObservation } from "./types/rate-observation";
import type { ScheduleRow } from "./types/schedule-row";
import type { SimulatePayload } from "./types/simulate-payload";
import type { Verdict } from "./types/verdict";
import type { VerdictResponse } from "./types/verdict-response";
import type { EarlyRepaymentResult } from "./types/early-repayment-result";
import type { RepaymentMode } from "./types/repayment-mode";

/** Wraps fetch into a Boxed Future<Result<T, string>> — no thrown exceptions leak to the UI. */
const request = <T>(url: string, init?: RequestInit): Future<Result<T, string>> =>
  Future.fromPromise(
    fetch(url, init).then(async (response) => {
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = (data as { error?: string })?.error ?? `HTTP ${response.status}`;
        throw new Error(message);
      }
      return data as T;
    }),
  ).mapError((e) => (e instanceof Error ? e.message : String(e)));

export const fetchRates = (): Future<Result<RateObservation[], string>> =>
  request<RateObservation[]>("/api/rates");

export const fetchVerdict = (): Future<Result<VerdictResponse, string>> =>
  request<VerdictResponse>("/api/verdict");

export const fetchSchedule = (): Future<Result<ScheduleRow[], string>> =>
  request<ScheduleRow[]>("/api/schedule");

export const simulate = (payload: SimulatePayload): Future<Result<Verdict, string>> =>
  request<Verdict>("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

type EarlyRepaymentPayload = { lumpSum: number /* euros */; mode: RepaymentMode };

export const earlyRepayment = (
  payload: EarlyRepaymentPayload,
): Future<Result<EarlyRepaymentResult, string>> =>
  request<EarlyRepaymentResult>("/api/early-repayment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

/** Persists the early repayment (modifies the loan schedule). */
export const applyEarlyRepayment = (
  payload: EarlyRepaymentPayload,
): Future<Result<EarlyRepaymentResult, string>> =>
  request<EarlyRepaymentResult>("/api/early-repayment/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
