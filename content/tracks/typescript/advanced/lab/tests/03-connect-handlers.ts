// connect: one handler object for several events, and the function that disconnects it.
import { CueBus } from "./solution.js";

type ShowEvents = {
  houseOpen: undefined;
  standby: { cue: number };
  cueGo: { cue: number; desk: "lights" | "sound" | "fly" };
  showStop: { reason: string };
};

function counts(bus: CueBus<ShowEvents>): number[] {
  return [bus.listenerCount("houseOpen"), bus.listenerCount("standby"), bus.listenerCount("cueGo"), bus.listenerCount("showStop")];
}

const bus = new CueBus<ShowEvents>();
const seen: string[] = [];
const disconnect = bus.connect({
  onHouseOpen: () => {
    seen.push("house open");
  },
  onStandby: (payload) => {
    seen.push(`standby ${payload.cue}`);
  },
  onCueGo: (payload) => {
    seen.push(`go ${payload.cue} ${payload.desk}`);
  },
});
check.equal(counts(bus), [1, 1, 1, 0], "connect adds one listener for each handler it is given");

bus.emit("houseOpen");
bus.emit("standby", { cue: 12 });
bus.emit("cueGo", { cue: 12, desk: "lights" });
bus.emit("showStop", { reason: "interval" });
check.equal(seen, ["house open", "standby 12", "go 12 lights"], "each handler receives its own event and payload");

bus.on("cueGo", () => {
  seen.push("stage manager");
});
disconnect();
check.equal(counts(bus), [0, 0, 1, 0], "the returned function removes exactly the listeners connect added");
disconnect();
check.equal(counts(bus), [0, 0, 1, 0], "disconnecting twice removes nothing more");
bus.emit("cueGo", { cue: 13, desk: "fly" });
check.equal(seen.slice(3), ["stage manager"], "disconnected handlers are no longer called");

const second = bus.connect({ onShowStop: undefined, onStandby: (payload) => seen.push(`again ${payload.cue}`) });
check.equal(counts(bus), [0, 1, 1, 0], "connect skips handlers that are undefined");
bus.emit("standby", { cue: 14 });
check.equal(seen.at(-1), "again 14", "a handler connected later works like the first ones");
second();
check.equal(counts(bus), [0, 0, 1, 0], "the second connection disconnects on its own");
