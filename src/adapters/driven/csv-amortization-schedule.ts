import { Result } from "@swan-io/boxed";
import type { AmortizationSchedule } from "../../domain/services/amortization-schedule";
import type { ScheduleRow } from "../../domain/services/schedule-row";
import { ParseError } from "../../domain/errors/parse-error";
import { toCents } from "../../domain/money";

/**
 * Parses a CSV amortization schedule (used by the `import-schedule` command).
 * Expected header: `month,payment,principal,interest,outstanding` with euro amounts (decimal point).
 */
export const parseScheduleCsv = (text: string): Result<AmortizationSchedule, ParseError> => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "");
  if (lines.length < 2) return Result.Error(ParseError("CSV has no data rows"));

  const rows: ScheduleRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 5) return Result.Error(ParseError(`malformed row: ${line}`));
    const month = Number(cols[0]);
    const payment = Number(cols[1]);
    const principal = Number(cols[2]);
    const interest = Number(cols[3]);
    const outstanding = Number(cols[4]);
    if ([month, payment, principal, interest, outstanding].some((n) => Number.isNaN(n))) {
      return Result.Error(ParseError(`non-numeric value in row: ${line}`));
    }
    rows.push({
      month,
      payment: toCents(payment),
      principalPart: toCents(principal),
      interestPart: toCents(interest),
      outstandingPrincipal: toCents(outstanding),
    });
  }
  return Result.Ok({ rows });
};
