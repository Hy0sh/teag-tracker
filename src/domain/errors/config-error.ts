export type ConfigError = { _tag: "ConfigError"; message: string };
export const ConfigError = (message: string): ConfigError => ({ _tag: "ConfigError", message });
