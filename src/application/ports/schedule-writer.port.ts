import type { Future, Result } from "@swan-io/boxed";
import type { ScheduleRow } from "../../domain/services/schedule-row";
import type { StoreError } from "../../domain/errors/store-error";

/** Persists (replaces) the amortization schedule. */
export type ScheduleWriterPort = (rows: ScheduleRow[]) => Future<Result<void, StoreError>>;
