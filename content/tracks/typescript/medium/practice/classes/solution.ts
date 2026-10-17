export interface Describable {
  describe(): string;
}

export abstract class Machine implements Describable {
  static installed = 0;
  readonly id: string;
  #credit = 0;

  constructor(id: string) {
    this.id = id;
    Machine.installed += 1;
  }

  get credit(): number {
    return this.#credit;
  }

  insert(cents: number): void {
    if (!Number.isInteger(cents) || cents <= 0) {
      throw new RangeError(`cannot insert ${cents} cents`);
    }
    this.#credit += cents;
  }

  abstract price(): number;

  start(): string {
    const price = this.price();
    if (this.#credit < price) {
      throw new Error(`${this.id} needs ${price - this.#credit} more cents`);
    }
    this.#credit -= price;
    return `${this.id} started`;
  }

  describe(): string {
    return `${this.id}: ${this.price()} cents`;
  }
}

export class Washer extends Machine {
  readonly hot: boolean;

  constructor(id: string, hot: boolean) {
    super(id);
    this.hot = hot;
  }

  price(): number {
    return this.hot ? 450 : 350;
  }
}

export class Dryer extends Machine {
  readonly minutes: number;

  constructor(id: string, minutes: number) {
    super(id);
    this.minutes = minutes;
  }

  price(): number {
    return 50 * Math.ceil(this.minutes / 10);
  }

  override describe(): string {
    return `${super.describe()}, ${this.minutes} min`;
  }
}
