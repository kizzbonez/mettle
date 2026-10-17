/// <reference lib="esnext.decorators" />
// Smart Oven Controls
//
// Keep the two lines at the top: the library reference types Symbol.metadata, and the polyfill
// below defines it, because Node.js 26 does not yet. Write the bodies marked "Not implemented"
// and add the constraint TODO 2 asks for.

(Symbol as { metadata?: symbol }).metadata ??= Symbol("Symbol.metadata");

/** 1: keeps a number accessor between min and max, initial value and every assignment. */
export function clamp(min: number, max: number) {
  return function <This>(
    target: ClassAccessorDecoratorTarget<This, number>,
    context: ClassAccessorDecoratorContext<This, number>,
  ): ClassAccessorDecoratorResult<This, number> {
    throw new Error("Not implemented");
  };
}

/** 2: logs "name(args)" to this.log, then calls the method. */
// TODO 2: constrain This so that only classes with a `log: string[]` can use @recorded.
export function recorded<This, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): (this: This, ...args: Args) => Return {
  throw new Error("Not implemented");
}

/** 3: adds the field's name to the `shown` list in the class metadata. */
export function shown(_value: undefined, context: ClassFieldDecoratorContext): void {
  throw new Error("Not implemented");
}

/** 4: the names of the class's @shown fields, in order, as a new array. */
export function shownFields(type: abstract new (...args: never[]) => object): string[] {
  throw new Error("Not implemented");
}
