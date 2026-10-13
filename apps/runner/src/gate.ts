export class BusyError extends Error {
  constructor() {
    super('The sandbox queue is full');
  }
}

/** Bounded concurrency with a bounded FIFO queue; excess work is refused, not buffered. */
export class Gate {
  private active = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(
    private readonly maxActive: number,
    private readonly maxWaiting: number,
  ) {}

  get stats(): { active: number; waiting: number } {
    return { active: this.active, waiting: this.waiting.length };
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active < this.maxActive) {
      this.active += 1;
    } else {
      if (this.waiting.length >= this.maxWaiting) throw new BusyError();
      // The finishing task hands its slot over, so `active` is not touched here.
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    try {
      return await task();
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.active -= 1;
    }
  }
}
