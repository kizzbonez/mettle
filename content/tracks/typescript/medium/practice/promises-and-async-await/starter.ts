// Library Holds
//
// Branch is complete: each branch's catalogue answers asynchronously, and rejects when it is
// offline. Write the four functions; each one uses a different Promise combinator.

export interface Branch {
  name: string;
  copiesOf(title: string): Promise<number>;
}

// Task 1: Promise.all
export async function totalCopies(branches: readonly Branch[], title: string): Promise<number> {
  throw new Error("Not implemented");
}

// Task 2: Promise.allSettled
export async function shelfReport(branches: readonly Branch[], title: string): Promise<string[]> {
  throw new Error("Not implemented");
}

// Task 3: Promise.any
export async function firstWithCopy(branches: readonly Branch[], title: string): Promise<string> {
  throw new Error("Not implemented");
}

// Task 4: Promise.race
export function withDeadline<T>(work: Promise<T>, deadline: Promise<void>): Promise<T> {
  throw new Error("Not implemented");
}
