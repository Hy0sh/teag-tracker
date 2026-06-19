import { Future, Result } from "@swan-io/boxed";
import type { RateSourcePort } from "../../application/ports/rate-source.port";
import type { MarketRate } from "../../domain/model/market-rate-type";
import { FetchError } from "../../domain/errors/fetch-error";

type SdmxValue = { id?: unknown };
type SdmxBody = {
  structure?: { dimensions?: { observation?: Array<{ id?: unknown; values?: SdmxValue[] }> } };
  dataSets?: Array<{ series?: Record<string, { observations?: Record<string, unknown[]> }> }>;
};
type SdmxJson = { data?: SdmxBody } & SdmxBody;

/**
 * Parses an SDMX-JSON payload (Banque de France Webstat or ECB Data Portal) into monthly market rates.
 * BdF nests under `data`, the ECB exposes `structure`/`dataSets` at the top level — both supported.
 * Rates are published in percent and converted to integer basis points (3.10% -> 310 bp).
 */
export const parseSdmxJson = (raw: unknown): Result<MarketRate[], FetchError> => {
  try {
    const root = (raw ?? {}) as SdmxJson;
    const data: SdmxBody = root.data ?? root;
    const observationDims = data?.structure?.dimensions?.observation ?? [];
    const timeDim = observationDims.find((d) => d.id === "TIME_PERIOD");
    const periods = timeDim?.values;
    const seriesMap = data?.dataSets?.[0]?.series;
    if (!Array.isArray(periods) || !seriesMap) {
      return Result.Error(FetchError("unexpected SDMX-JSON structure"));
    }
    const firstSeries = Object.values(seriesMap)[0];
    const observations = firstSeries?.observations;
    if (!observations) return Result.Error(FetchError("no observations in SDMX-JSON"));

    const rates: MarketRate[] = [];
    for (const [index, value] of Object.entries(observations)) {
      const period = periods[Number(index)];
      const percent = Array.isArray(value) ? Number(value[0]) : Number.NaN;
      if (period?.id == null || Number.isNaN(percent)) continue;
      // percent -> integer basis points (3.10% -> 310), no float storage
      rates.push({ date: String(period.id), rateBp: Math.round(percent * 100) });
    }
    if (rates.length === 0) return Result.Error(FetchError("no usable observations in SDMX-JSON"));
    return Result.Ok(rates);
  } catch (e) {
    return Result.Error(FetchError(`SDMX-JSON parse failed: ${String(e)}`));
  }
};

export type BdfOptions = { url: string | undefined; apiKey: string | undefined };

/**
 * Banque de France Webstat source. Requires `url` pointing at an SDMX-JSON series
 * (and `apiKey` when the series is behind the developer subscription gateway).
 */
export const makeBdfSource =
  (opts: BdfOptions): RateSourcePort =>
  () => {
    const { url, apiKey } = opts;
    if (!url) {
      return Future.value(
        Result.Error(
          FetchError(
            "BDF_API_URL not configured — set it to a Banque de France Webstat SDMX-JSON series URL (and BDF_API_KEY if the series requires a developer subscription)",
          ),
        ),
      );
    }
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) headers["Ocp-Apim-Subscription-Key"] = apiKey;

    return Future.fromPromise(
      fetch(url, { headers }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    ).map((r) =>
      r.match({
        Ok: (json) => parseSdmxJson(json),
        Error: (e) => Result.Error(FetchError(`BdF fetch failed: ${String(e)}`)),
      }),
    );
  };
