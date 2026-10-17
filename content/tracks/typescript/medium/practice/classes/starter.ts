// Laundromat Machines
//
// Describable is complete. Finish Machine, Washer and Dryer: add the fields each task asks
// for and replace every `throw new Error("Not implemented")`. Declare fields in the class body
// and assign them in the constructor (no parameter properties).

export interface Describable {
  describe(): string;
}

export abstract class Machine implements Describable {
  // Task 1: the static counter `installed`, the read-only `id`, and the hard-private credit.

  constructor(id: string) {
    throw new Error("Not implemented");
  }

  // Task 1: a getter `credit` that reads the private credit.

  insert(cents: number): void {
    throw new Error("Not implemented");
  }

  // One cycle's price in cents. Every kind of machine has its own.
  abstract price(): number;

  start(): string {
    throw new Error("Not implemented");
  }

  describe(): string {
    throw new Error("Not implemented");
  }
}

export class Washer extends Machine {
  // Task 2: the read-only field `hot`.

  constructor(id: string, hot: boolean) {
    super(id);
    throw new Error("Not implemented");
  }

  price(): number {
    throw new Error("Not implemented");
  }
}

export class Dryer extends Machine {
  // Task 3: the read-only field `minutes`, and a describe() that overrides Machine's.

  constructor(id: string, minutes: number) {
    super(id);
    throw new Error("Not implemented");
  }

  price(): number {
    throw new Error("Not implemented");
  }
}
