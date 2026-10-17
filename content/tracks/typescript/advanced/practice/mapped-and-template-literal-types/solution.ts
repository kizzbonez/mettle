/** The cup sizes the shop sells. */
export type CupSize = "small" | "medium" | "large";

/** Every property optional and writable, with the same type. */
export type Patch<T> = { -readonly [K in keyof T]?: T[K] };

/** set<Key>(value) for every string key whose type is not a function. */
export type Setters<T> = {
  [K in keyof T & string as T[K] extends (...args: never[]) => unknown ? never : `set${Capitalize<K>}`]: (
    value: T[K],
  ) => void;
};

/** Setters that assign to the target's own non-function properties. */
export function makeSetters<T extends object>(target: T): Setters<T> {
  const fields = target as Record<string, unknown>;
  const setters: Record<string, (value: unknown) => void> = {};
  for (const key of Object.keys(fields)) {
    if (typeof fields[key] === "function") continue;
    setters[`set${key[0].toUpperCase()}${key.slice(1)}`] = (value) => {
      fields[key] = value;
    };
  }
  return setters as Setters<T>;
}

/** { size, drink } for a ticket "SIZE-DRINK" whose SIZE is a CupSize, otherwise never. */
export type TicketParts<S extends string> = S extends `${infer Size}-${infer Drink}`
  ? Size extends CupSize
    ? { size: Size; drink: Drink }
    : never
  : never;
