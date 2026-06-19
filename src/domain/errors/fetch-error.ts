export type FetchError = { _tag: "FetchError"; message: string };
export const FetchError = (message: string): FetchError => ({ _tag: "FetchError", message });
