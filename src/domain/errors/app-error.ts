import type { ConfigError } from "./config-error";
import type { FetchError } from "./fetch-error";
import type { ParseError } from "./parse-error";
import type { StoreError } from "./store-error";

export type AppError = ConfigError | FetchError | ParseError | StoreError;
