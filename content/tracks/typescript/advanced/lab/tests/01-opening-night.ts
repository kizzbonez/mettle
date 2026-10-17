// The start of opening night from the instructions: listeners, emit, off and the counts.
import { CueBus } from "./solution.js";

type ShowEvents = {
  houseOpen: undefined;
  standby: { cue: number };
  cueGo: { cue: number; desk: "lights" | "sound" | "fly" };
  showStop: { reason: string };
};

const bus = new CueBus<ShowEvents>();
const log: unknown[] = [];
let houseOpened = 0;

bus.on("houseOpen", () => {
  houseOpened++;
});
const offLights = bus.on("cueGo", (payload) => log.push(["lights", payload]));
bus.on("cueGo", (payload) => log.push(["sound", payload]));

check.equal(bus.emit("houseOpen"), 1, "emit returns the number of listeners it called (houseOpen)");
check.equal(houseOpened, 1, "the houseOpen listener ran once");
check.equal(bus.emit("cueGo", { cue: 1, desk: "lights" }), 2, "emit returns the number of listeners it called (cueGo)");
check.equal(
  log,
  [
    ["lights", { cue: 1, desk: "lights" }],
    ["sound", { cue: 1, desk: "lights" }],
  ],
  "listeners run in the order they were added and receive the payload",
);
check.equal(bus.listenerCount("cueGo"), 2, "listenerCount counts the listeners of one event");

offLights();
check.equal(bus.listenerCount("cueGo"), 1, "the function returned by on removes that listener");
check.equal(bus.emit("standby", { cue: 2 }), 0, "emit returns 0 when nobody listens");
check.equal(bus.emit("cueGo", { cue: 2, desk: "sound" }), 1, "a removed listener is no longer called");
check.equal(log.length, 3, "only the remaining cueGo listener ran on the second cue");
