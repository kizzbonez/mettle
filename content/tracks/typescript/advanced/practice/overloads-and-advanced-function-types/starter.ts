// Car Park Ticket Machine
//
// Each signature below compiles but is too loose. Fix the types as the TODOs ask, then replace
// every `throw new Error("Not implemented")` with the real code.

// TODO 1: add three overload signatures above this implementation, so "clock" returns a
// string, "parts" returns the tuple, and a style of either kind returns the union.
export function formatStay(minutes: number, style: "clock" | "parts"): string | [hours: number, minutes: number] {
  throw new Error("Not implemented");
}

// TODO 2: give raise and lower a `this` parameter of type Barrier.
export interface Barrier {
  open: boolean;
  raises: number;
  raise(): number;
  lower(): void;
}

/** A new closed barrier that has not been raised yet. */
export function createBarrier(): Barrier {
  throw new Error("Not implemented");
}

// TODO 3: keep fn's exact parameters with a rest type parameter `A extends unknown[]`.
export function limitCalls<R>(fn: (...args: any[]) => R, max: number): (...args: any[]) => R | undefined {
  throw new Error("Not implemented");
}
