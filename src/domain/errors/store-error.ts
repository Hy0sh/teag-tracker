export type StoreError = { _tag: "StoreError"; message: string };
export const StoreError = (message: string): StoreError => ({ _tag: "StoreError", message });
