// Type-level tests: the types accept correct use and reject misuse. The misuse sits in
// functions that are never called, so it is only type-checked, never run.
import { CueBus, type Handlers, type PayloadArgs } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type ShowEvents = {
  houseOpen: undefined;
  standby: { cue: number };
  cueGo: { cue: number; desk: "lights" | "sound" | "fly" };
  showStop: { reason: string };
  note: string | undefined;
};

export type PayloadCases = [
  Expect<Equal<PayloadArgs<undefined>, []>>,
  Expect<Equal<PayloadArgs<{ cue: number }>, [payload: { cue: number }]>>,
  Expect<Equal<PayloadArgs<string | undefined>, [payload: string | undefined]>>,
];

export type HandlerCases = [
  Expect<Equal<keyof Handlers<ShowEvents>, "onHouseOpen" | "onStandby" | "onCueGo" | "onShowStop" | "onNote">>,
  Expect<Equal<Partial<Handlers<ShowEvents>>, Handlers<ShowEvents>>>,
];

export function correctUse(bus: CueBus<ShowEvents>): void {
  bus.emit("houseOpen");
  bus.emit("note", undefined);
  bus.emit("note", "house lights to half");
  bus.on("standby", (payload) => console.log(payload.cue + 1));
  bus.connect({ onCueGo: (payload) => console.log(payload.desk.toUpperCase()) });
  bus.connect({});
}

export function misuse(bus: CueBus<ShowEvents>): void {
  // @ts-expect-error cueGo needs its payload
  bus.emit("cueGo");
  // @ts-expect-error houseOpen carries no payload
  bus.emit("houseOpen", undefined);
  // @ts-expect-error the cue must be a number
  bus.emit("cueGo", { cue: "4", desk: "lights" });
  // @ts-expect-error there is no curtainUp event
  bus.emit("curtainUp");
  // @ts-expect-error the note event takes its argument even though it may be undefined
  bus.emit("note");
  // @ts-expect-error a standby payload has no desk
  bus.on("standby", (payload) => console.log(payload.desk));
  // @ts-expect-error there is no curtainUp event to handle
  bus.connect({ onCurtainUp: () => {} });
  // @ts-expect-error handler names are "on" plus the event name with a capital first letter
  bus.connect({ oncueGo: () => {} });
  // @ts-expect-error a houseOpen handler receives no payload
  bus.connect({ onHouseOpen: (payload: string) => console.log(payload) });
  // @ts-expect-error a cueGo handler receives a cueGo payload, not a standby one
  bus.connect({ onCueGo: (payload: { reason: string }) => console.log(payload.reason) });
}

export async function misuseNext(bus: CueBus<ShowEvents>): Promise<void> {
  const standby = await bus.next("standby");
  // @ts-expect-error a standby cue is a number
  const cue: string = standby.cue;
  console.log(cue);
}

check.true(typeof CueBus === "function", "the module exports the CueBus class");
