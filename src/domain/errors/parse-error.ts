export type ParseError = { _tag: "ParseError"; message: string };
export const ParseError = (message: string): ParseError => ({ _tag: "ParseError", message });
