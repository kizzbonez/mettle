// next: waiting for the next occurrence of an event, and cancelling the wait with an AbortSignal.
import { getEventListeners } from "node:events";
import { CueBus } from "./solution.js";

type ShowEvents = {
  houseOpen: undefined;
  standby: { cue: number };
  cueGo: { cue: number; desk: "lights" | "sound" | "fly" };
  showStop: { reason: string };
};

const bus = new CueBus<ShowEvents>();

const nextGo = bus.next("cueGo");
check.equal(bus.listenerCount("cueGo"), 1, "a waiting next counts as a listener");
check.equal(bus.emit("cueGo", { cue: 3, desk: "sound" }), 1, "emit counts a waiting next among the listeners it called");
check.equal(bus.listenerCount("cueGo"), 0, "next stops listening as soon as its event arrives");
bus.emit("cueGo", { cue: 4, desk: "sound" });
check.equal(await nextGo, { cue: 3, desk: "sound" }, "next resolves with the payload of the first emit after it was called");

const opened = bus.next("houseOpen");
const alsoOpened = bus.next("houseOpen");
check.equal(bus.emit("houseOpen"), 2, "two waiting calls to next are two listeners");
check.equal(await opened, undefined, "next resolves with undefined for an event without a payload");
check.equal(await alsoOpened, undefined, "one emit resolves every next that was waiting for it");

const controller = new AbortController();
const waiting = bus.next("standby", { signal: controller.signal });
const reason = new Error("show stopped");
controller.abort(reason);
check.equal(bus.listenerCount("standby"), 0, "aborting the signal stops next from listening at once");
const aborted = await check.rejects(() => waiting, "next rejects when its signal is aborted");
check.true(aborted === reason, "next rejects with the signal's reason");
check.equal(bus.emit("standby", { cue: 9 }), 0, "an aborted next is not called by later emits");

const finished = new AbortController();
finished.abort(new Error("too late"));
const late = bus.next("showStop", { signal: finished.signal });
check.equal(bus.listenerCount("showStop"), 0, "next with an already aborted signal never starts listening");
const lateError = await check.rejects(() => late, "next rejects at once when the signal is already aborted");
check.equal(lateError.message, "too late", "the rejection is the already aborted signal's reason");

const usher = new AbortController();
const seated = bus.next("standby", { signal: usher.signal });
check.equal(getEventListeners(usher.signal, "abort").length, 1, "next listens for abort on its signal while it waits");
bus.emit("standby", { cue: 10 });
check.equal(await seated, { cue: 10 }, "next with a signal resolves normally when the event comes first");
check.equal(getEventListeners(usher.signal, "abort").length, 0, "next removes its abort listener once it has resolved");
usher.abort(new Error("after the fact"));
check.equal(bus.listenerCount("standby"), 0, "aborting after next resolved changes nothing");
