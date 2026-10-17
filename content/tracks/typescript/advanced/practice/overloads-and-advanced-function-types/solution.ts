/** A stay in minutes as "H:MM", or as the tuple [hours, minutes]. */
export function formatStay(minutes: number, style: "clock"): string;
export function formatStay(minutes: number, style: "parts"): [hours: number, minutes: number];
export function formatStay(minutes: number, style: "clock" | "parts"): string | [hours: number, minutes: number];
export function formatStay(minutes: number, style: "clock" | "parts"): string | [hours: number, minutes: number] {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (style === "clock") return `${hours}:${String(rest).padStart(2, "0")}`;
  return [hours, rest];
}

export interface Barrier {
  open: boolean;
  raises: number;
  raise(this: Barrier): number;
  lower(this: Barrier): void;
}

/** A new closed barrier that has not been raised yet. */
export function createBarrier(): Barrier {
  return {
    open: false,
    raises: 0,
    raise() {
      this.open = true;
      this.raises += 1;
      return this.raises;
    },
    lower() {
      this.open = false;
    },
  };
}

/** Calls fn for the first `max` calls, then returns undefined without calling it. */
export function limitCalls<A extends unknown[], R>(fn: (...args: A) => R, max: number): (...args: A) => R | undefined {
  let calls = 0;
  return (...args) => {
    if (calls >= max) return undefined;
    calls += 1;
    return fn(...args);
  };
}
