// Registrations, changes made during an emit, and listeners that throw.
import { CueBus } from "./solution.js";

type ShowEvents = {
  houseOpen: undefined;
  standby: { cue: number };
  cueGo: { cue: number; desk: "lights" | "sound" | "fly" };
  showStop: { reason: string };
};

const bus = new CueBus<ShowEvents>();

const reasons: string[] = [];
const note = (payload: { reason: string }): void => {
  reasons.push(payload.reason);
};
const offFirst = bus.on("showStop", note);
bus.on("showStop", note);
check.equal(bus.emit("showStop", { reason: "fire alarm" }), 2, "the same function added twice is two listeners");
check.equal(reasons, ["fire alarm", "fire alarm"], "each registration of the same function is called");
offFirst();
offFirst();
check.equal(bus.listenerCount("showStop"), 1, "off removes only its own registration, and a second call removes nothing");
check.equal(bus.listenerCount("houseOpen"), 0, "an event nobody listened to has no listeners");

const order: string[] = [];
let offSelf = (): void => {};
offSelf = bus.on("standby", (payload) => {
  order.push(`first ${payload.cue}`);
  offSelf();
  bus.on("standby", (later) => {
    order.push(`late ${later.cue}`);
  });
});
bus.on("standby", (payload) => {
  order.push(`second ${payload.cue}`);
});
check.equal(bus.emit("standby", { cue: 5 }), 2, "emit calls the listeners registered when it started");
check.equal(order, ["first 5", "second 5"], "a listener added during an emit is not called by that emit");
check.equal(bus.emit("standby", { cue: 6 }), 2, "the next emit sees listeners added and removed during the last one");
check.equal(order, ["first 5", "second 5", "second 6", "late 6"], "changes made during an emit apply from the next emit, in order");

const ran: string[] = [];
bus.on("cueGo", () => {
  ran.push("lights");
  throw new Error("lamp blown");
});
bus.on("cueGo", () => {
  ran.push("sound");
});
bus.on("cueGo", () => {
  ran.push("fly");
  throw new RangeError("fly bar stuck");
});
const failure = check.throws(
  () => bus.emit("cueGo", { cue: 7, desk: "fly" }),
  "emit throws an AggregateError when listeners throw",
  AggregateError,
);
check.equal(ran, ["lights", "sound", "fly"], "every listener runs even after an earlier one throws");
const errors = (failure as AggregateError).errors as Error[];
check.equal(errors.map((error) => error.message), ["lamp blown", "fly bar stuck"], "the AggregateError holds each thrown error, in order");
check.true(errors[1] instanceof RangeError, "the AggregateError keeps the original error objects");
