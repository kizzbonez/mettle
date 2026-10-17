/** Event name to payload type. `undefined` means the event carries no payload. */
export type EventMap = Record<string, unknown>;

/** The arguments `emit` takes after the name: none for an `undefined` payload, else exactly one. */
export type PayloadArgs<P> = [P] extends [undefined] ? [] : [payload: P];

/** A listener receives the payload, or nothing for an event without one. */
export type Listener<P> = (...args: PayloadArgs<P>) => void;

/** One optional handler per event, named `on` plus the event name with a capital first letter. */
export type Handlers<Events extends EventMap> = {
  [K in keyof Events & string as `on${Capitalize<K>}`]?: Listener<Events[K]>;
};

export interface NextOptions {
  signal?: AbortSignal;
}

type AnyListener = (...args: unknown[]) => void;

interface Registration {
  readonly listener: AnyListener;
}

export class CueBus<Events extends EventMap> {
  readonly #listeners = new Map<string, Registration[]>();

  on<K extends keyof Events & string>(name: K, listener: Listener<Events[K]>): () => void {
    const registration: Registration = { listener: listener as AnyListener };
    const list = this.#listeners.get(name) ?? [];
    list.push(registration);
    this.#listeners.set(name, list);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const current = this.#listeners.get(name) ?? [];
      const index = current.indexOf(registration);
      if (index !== -1) current.splice(index, 1);
    };
  }

  emit<K extends keyof Events & string>(name: K, ...args: PayloadArgs<Events[K]>): number {
    const snapshot = [...(this.#listeners.get(name) ?? [])];
    const errors: unknown[] = [];
    for (const { listener } of snapshot) {
      try {
        listener(...args);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, `${errors.length} listener(s) failed on ${name}`);
    }
    return snapshot.length;
  }

  listenerCount(name: keyof Events & string): number {
    return this.#listeners.get(name)?.length ?? 0;
  }

  connect(handlers: Handlers<Events>): () => void {
    const offs: (() => void)[] = [];
    for (const [key, handler] of Object.entries(handlers)) {
      if (typeof handler !== "function" || !key.startsWith("on") || key.length < 3) continue;
      const name = (key[2].toLowerCase() + key.slice(3)) as keyof Events & string;
      offs.push(this.on(name, handler as Listener<Events[typeof name]>));
    }
    return () => {
      for (const off of offs) off();
    };
  }

  next<K extends keyof Events & string>(name: K, options: NextOptions = {}): Promise<Events[K]> {
    const { signal } = options;
    const { promise, resolve, reject } = Promise.withResolvers<Events[K]>();
    if (signal?.aborted) {
      reject(signal.reason);
      return promise;
    }
    const onAbort = (): void => {
      off();
      reject(signal?.reason);
    };
    const settle: AnyListener = (...args) => {
      off();
      signal?.removeEventListener("abort", onAbort);
      resolve(args[0] as Events[K]);
    };
    const off = this.on(name, settle as Listener<Events[K]>);
    signal?.addEventListener("abort", onAbort, { once: true });
    return promise;
  }
}
