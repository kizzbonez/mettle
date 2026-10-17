/** One bike of the fleet. */
export interface Bike {
  id: string;
  size: "S" | "M" | "L";
  electric: boolean;
  dailyRate: number;
}

/** Groups the items by their value at `key`, in the order each value first appears. */
export function groupBy<T, K extends keyof T>(items: readonly T[], key: K): Map<T[K], T[]> {
  const groups = new Map<T[K], T[]>();
  for (const item of items) {
    const value = item[key];
    const group = groups.get(value);
    if (group === undefined) {
      groups.set(value, [item]);
    } else {
      group.push(item);
    }
  }
  return groups;
}

/** The requested choice when it is one of `choices`, otherwise the fallback. */
export function pickOr<C extends string>(choices: readonly C[], requested: string | undefined, fallback: NoInfer<C>): C {
  return choices.find((choice) => choice === requested) ?? fallback;
}

/** The stops of the guided ride, in order. Throws when a stop appears twice. */
export function tourStops<const T extends readonly string[]>(stops: T): T {
  const seen = new Set<string>();
  for (const stop of stops) {
    if (seen.has(stop)) throw new Error(`stop "${stop}" appears twice`);
    seen.add(stop);
  }
  return stops;
}
