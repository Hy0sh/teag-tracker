import type { Future, Result } from "@swan-io/boxed";
import type { Loan } from "../../domain/model/loan";
import type { ConfigError } from "../../domain/errors/config-error";

export type LoanConfigPort = () => Future<Result<Loan, ConfigError>>;
