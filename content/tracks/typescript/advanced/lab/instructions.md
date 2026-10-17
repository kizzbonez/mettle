Write `solution.ts`. The starter exports every name the tests import. Keep the names, the type
parameters and the method signatures of `CueBus`. You may add private fields, private methods
and helper types. The tests describe a show with this type:

```ts
type ShowEvents = {
  houseOpen: undefined;
  standby: { cue: number };
  cueGo: { cue: number; desk: "lights" | "sound" | "fly" };
  showStop: { reason: string };
};
```

Each key is an event name and its type is the event's payload. `undefined` means the event has
no payload.

**Types.** Hidden tests check them with `@ts-expect-error` and an exact type comparison, so a
type that is too loose fails even when the code runs.

1. `PayloadArgs<P>` is the tuple of arguments that follow the event name: `[]` when `P` is
   `undefined`, otherwise `[payload: P]`. An event whose payload type is `string | undefined`
   still takes exactly one argument, so `PayloadArgs<string | undefined>` is
   `[payload: string | undefined]` (lesson 2: watch out for distribution). `Listener<P>`, given,
   is built from it.
2. `Handlers<Events>` has one **optional** property per event, named `on` followed by the event
   name with its first letter in upper case, whose type is that event's `Listener`. For
   `ShowEvents` the keys are exactly `onHouseOpen`, `onStandby`, `onCueGo` and `onShowStop`, so
   `{ onCurtainUp: ... }` or `{ oncueGo: ... }` is rejected and `{}` is accepted.

**The bus.** `class CueBus<Events extends EventMap>` keeps its listeners per event name.

3. `on(name, listener)` adds a listener and returns a function that removes that registration.
   Adding the same function twice makes two registrations, each called on every emit and each
   removed by its own function. Calling a remove function a second time does nothing.
4. `emit(name, ...args)` calls the listeners of `name` that were registered **when the emit
   started**, in the order they were added, passing the payload (or nothing). A listener added or
   removed by another listener during an emit takes effect from the next emit. It returns the
   number of listeners it called (`0` if none).
   If any listeners throw, `emit` still calls all the others, then throws one `AggregateError`
   whose `errors` are the thrown values in order, with the message
   `` `${count} listener(s) failed on ${name}` ``.
5. `listenerCount(name)` returns how many registrations `name` has now.
6. `connect(handlers)` adds each handler that is a function as a listener of its event (the key
   without `on`, with the first letter in lower case: `onCueGo` listens to `cueGo`) and skips
   handlers that are `undefined`. It returns a function that removes exactly the listeners this
   call added; calling it again does nothing.
7. `next(name, options)` returns a promise for the payload of the next emit of `name` (or
   `undefined` for an event without a payload):
   - while it waits it is an ordinary registration: `listenerCount` counts it and `emit`
     includes it in the number it returns;
   - when the event arrives it removes its listener before resolving, so a later emit does not
     see it, and if it has a signal it removes its `abort` listener from the signal;
   - with `options.signal` already aborted, it rejects with `signal.reason` without adding a
     listener;
   - when the signal is aborted while it waits, it removes its listener at once and rejects with
     `signal.reason`. Listen with `signal.addEventListener("abort", ...)`.

Example, the start of opening night:

```ts
const bus = new CueBus<ShowEvents>();
const offLights = bus.on("cueGo", (payload) => console.log("lights", payload.cue));
bus.on("cueGo", (payload) => console.log("sound", payload.cue));
bus.emit("houseOpen");                         // 0: nobody listens yet
bus.emit("cueGo", { cue: 1, desk: "lights" }); // prints "lights 1", "sound 1"; returns 2
offLights();
bus.listenerCount("cueGo");                    // 1

const stop = new AbortController();
const nextStandby = bus.next("standby", { signal: stop.signal });
bus.emit("standby", { cue: 2 });               // returns 1: the waiting next
await nextStandby;                             // { cue: 2 }

bus.emit("cueGo");                             // compile error: cueGo needs its payload
bus.connect({ onCurtainUp: () => {} });        // compile error: no curtainUp event
```

**Tips.** Store each registration as its own small object, so removing one finds exactly it,
and copy the list before an emit loops over it. `Promise.withResolvers` keeps `next` short.
Write `PayloadArgs` with the non-distributive form from lesson 2, and build `Handlers` with key
remapping and `Capitalize` from lesson 3.
