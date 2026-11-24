/** One anonymous survey answer. Never carries a name. */
export type Quote = { text: string; role: string; years: number; keyword?: string };

/** A quote on screen at time t: which one, how much is typed, when it appeared. */
export type LiveQuote = { key: number; quote: Quote; typed: number; start: number };
