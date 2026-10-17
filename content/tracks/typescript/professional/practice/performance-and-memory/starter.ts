// Library Loans
//
// Loans of one shape, a count that does less work, and a cache that cannot grow forever.

export interface LoanInput {
  readonly id: string;
  readonly title: string;
  readonly member: string;
  readonly dueDay: number;
  readonly renewals?: number;
  readonly note?: string;
}

/** Every field is always present, so every loan has the same shape. */
export interface Loan {
  id: string;
  title: string;
  member: string;
  dueDay: number;
  renewals: number;
  note: string | undefined;
}

export interface LruCache<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  readonly size: number;
  keys(): string[];
}

// Step 1: one place that creates loans, every field assigned in the same order.
export function makeLoan(input: LoanInput): Loan {
  throw new Error("Not implemented");
}

// Step 2: the title borrowed most often. This version is correct but far too slow for a
// year of loans: every title is counted with a pass over the whole list. Make it fast.
export function mostBorrowed(titles: readonly string[]): string | undefined {
  let best: string | undefined;
  let bestCount = 0;
  for (const title of titles) {
    const count = titles.filter((other) => other === title).length;
    if (count > bestCount) {
      best = title;
      bestCount = count;
    }
  }
  return best;
}

// Step 3: a cache that keeps at most `limit` entries, dropping the least recently used.
export function createLruCache<V>(limit: number): LruCache<V> {
  throw new Error("Not implemented");
}
