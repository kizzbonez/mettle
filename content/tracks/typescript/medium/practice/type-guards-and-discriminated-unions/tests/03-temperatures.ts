// isTemperature narrows in if and filter, and warmestRoom finds the earliest highest reading.
import { isTemperature, warmestRoom, type HomeEvent, type TemperatureEvent } from "./solution.js";

const day: HomeEvent[] = [
  { kind: "motion", room: "hallway" },
  { kind: "temperature", room: "office", celsius: 21 },
  { kind: "battery", device: "door sensor", percent: 80 },
  { kind: "temperature", room: "lounge", celsius: 23.5 },
  { kind: "temperature", room: "bedroom", celsius: 23.5 },
  { kind: "leak", room: "kitchen" },
];

check.equal(day.map(isTemperature), [false, true, false, true, true, false], "isTemperature is true exactly for temperature events");
const readings: TemperatureEvent[] = day.filter(isTemperature);
check.equal(readings.map((reading) => reading.room), ["office", "lounge", "bedroom"], "filter(isTemperature) keeps the readings in order");
check.equal(warmestRoom(day), "lounge", "on a tie, the earliest warmest reading wins");

const cold: HomeEvent[] = [
  { kind: "temperature", room: "garage", celsius: -4 },
  { kind: "temperature", room: "shed", celsius: -1 },
];
check.equal(warmestRoom(cold), "shed", "below zero, -1 is warmer than -4");
check.equal(warmestRoom([{ kind: "motion", room: "hallway" }]), undefined, "no temperature readings");
check.equal(warmestRoom([]), undefined, "no events at all");

function celsiusOf(event: HomeEvent): number | undefined {
  if (isTemperature(event)) {
    return event.celsius;
  }
  return undefined;
}
check.equal(day.map(celsiusOf).filter((value) => value !== undefined), [21, 23.5, 23.5], "inside if (isTemperature(event)), celsius can be read");
