/** Event name to payload type. `undefined` means the event carries no payload. */
export type EventMap = Record<string, unknown>;

/**
 * Step 1: the arguments `emit` takes after the event name.
 * `[]` when the payload type is `undefined`, otherwise exactly one argument, `[payload: P]`.
 * An event whose payload type is `string | undefined` still takes one argument.
 */
export type PayloadArgs<P> = unknown[];

/** A listener receives the payload, or nothing for an event without one. */
export type Listener<P> = (...args: PayloadArgs<P>) => void;

/**
 * Step 2: one optional handler per event, named "on" followed by the event name with its first
 * letter in upper case (`cueGo` becomes `onCueGo`), typed as that event's Listener.
 */
export type Handlers<Events extends EventMap> = Record<string, unknown>;

export interface NextOptions {
  signal?: AbortSignal;
}

export class CueBus<Events extends EventMap> {
  on<K extends keyof Events & string>(name: K, listener: Listener<Events[K]>): () => void {
    throw new Error("Not implemented");
  }

  emit<K extends keyof Events & string>(name: K, ...args: PayloadArgs<Events[K]>): number {
    throw new Error("Not implemented");
  }

  listenerCount(name: keyof Events & string): number {
    throw new Error("Not implemented");
  }

  connect(handlers: Handlers<Events>): () => void {
    throw new Error("Not implemented");
  }

  next<K extends keyof Events & string>(name: K, options: NextOptions = {}): Promise<Events[K]> {
    throw new Error("Not implemented");
  }
}
