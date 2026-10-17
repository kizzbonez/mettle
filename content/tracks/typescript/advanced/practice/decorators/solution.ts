/// <reference lib="esnext.decorators" />
// Node.js 26 does not define Symbol.metadata yet; this must run before any decorated class.
(Symbol as { metadata?: symbol }).metadata ??= Symbol("Symbol.metadata");

/** Keeps a number accessor between min and max, initial value and every assignment. */
export function clamp(min: number, max: number) {
  return function <This>(
    target: ClassAccessorDecoratorTarget<This, number>,
    _context: ClassAccessorDecoratorContext<This, number>,
  ): ClassAccessorDecoratorResult<This, number> {
    const fit = (value: number): number => Math.min(max, Math.max(min, value));
    return {
      init: fit,
      set(value) {
        target.set.call(this, fit(value));
      },
    };
  };
}

/** Logs "name(args)" to this.log, then calls the method. */
export function recorded<This extends { log: string[] }, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): (this: This, ...args: Args) => Return {
  const name = String(context.name);
  return function (this: This, ...args: Args): Return {
    this.log.push(`${name}(${args.join(", ")})`);
    return method.call(this, ...args);
  };
}

/** Adds the field's name to the `shown` list in the class metadata. */
export function shown(_value: undefined, context: ClassFieldDecoratorContext): void {
  const fields = (context.metadata.shown ??= []) as string[];
  fields.push(String(context.name));
}

/** The names of the class's @shown fields, in order, as a new array. */
export function shownFields(type: abstract new (...args: never[]) => object): string[] {
  const fields = type[Symbol.metadata]?.shown ?? [];
  return [...(fields as string[])];
}
