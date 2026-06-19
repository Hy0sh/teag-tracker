import { Future, Result } from "@swan-io/boxed";
import type { Db } from "./db/database";
import type { ScheduleWriterPort } from "../../application/ports/schedule-writer.port";
import { StoreError } from "../../domain/errors/store-error";
import { importSchedule } from "./db/import";

export const makePgScheduleWriter =
  (db: Db): ScheduleWriterPort =>
  (rows) =>
    Future.fromPromise(importSchedule(db, rows)).map((r) =>
      r.match({
        Ok: () => Result.Ok<void, StoreError>(undefined),
        Error: (e) => Result.Error(StoreError(`persist schedule failed: ${String(e)}`)),
      }),
    );
