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

export function makeLoan(input: LoanInput): Loan {
  // One object literal, the same fields in the same order, so V8 gives every loan one hidden class.
  return {
    id: input.id,
    title: input.title,
    member: input.member,
    dueDay: input.dueDay,
    renewals: input.renewals ?? 0,
    note: input.note,
  };
}

export function mostBorrowed(titles: readonly string[]): string | undefined {
  const counts = new Map<string, number>(); // remembers the order titles first appear
  for (const title of titles) counts.set(title, (counts.get(title) ?? 0) + 1);
  let best: string | undefined;
  let bestCount = 0;
  for (const [title, count] of counts) {
    if (count > bestCount) {
      best = title;
      bestCount = count;
    }
  }
  return best;
}

export function createLruCache<V>(limit: number): LruCache<V> {
  const entries = new Map<string, V>(); // insertion order: least recently used first
  return {
    get(key) {
      if (!entries.has(key)) return undefined;
      const value = entries.get(key) as V;
      entries.delete(key); // move to the end: most recently used
      entries.set(key, value);
      return value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, value);
      if (entries.size > limit) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
      }
    },
    get size() {
      return entries.size;
    },
    keys() {
      return [...entries.keys()];
    },
  };
}
