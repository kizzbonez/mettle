// assertDoor returns for door events, throws a TypeError for every other kind, and narrows the
// event for the rest of the scope.
import { assertDoor, type HomeEvent } from "./solution.js";

function doorLine(event: HomeEvent): string {
  assertDoor(event);
  return `${event.door}: ${event.open ? "open" : "shut"}`;
}

check.equal(doorLine({ kind: "door", door: "front", open: true }), "front: open", "after assertDoor, an open door's fields can be read");
check.equal(doorLine({ kind: "door", door: "patio", open: false }), "patio: shut", "after assertDoor, a shut door's fields can be read");
check.equal(assertDoor({ kind: "door", door: "side", open: false }), undefined, "assertDoor returns nothing for a door event");

const others: HomeEvent[] = [
  { kind: "motion", room: "hallway" },
  { kind: "temperature", room: "office", celsius: 21 },
  { kind: "battery", device: "door sensor", percent: 5 },
  { kind: "leak", room: "kitchen" },
];
for (const event of others) {
  check.throws(() => assertDoor(event), `assertDoor throws a TypeError for a ${event.kind} event`, TypeError);
}

function typeChecksOnly(event: HomeEvent): void {
  // @ts-expect-error before assertDoor, the event may not be a door
  const early: boolean = event.open;
  assertDoor(event);
  const late: boolean = event.open;
}
check.true(typeof typeChecksOnly === "function", "assertDoor narrows the event to a DoorEvent");
